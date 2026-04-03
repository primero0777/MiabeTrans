<?php
class Validator {
    private $errors = [];
    private $db;
    private $conn;
    
    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }
    
    public function validate($data, $rules) {
        $this->errors = [];
        
        foreach ($rules as $field => $ruleString) {
            $rules = explode('|', $ruleString);
            $value = $data[$field] ?? null;
            
            foreach ($rules as $rule) {
                if ($rule === 'required') {
                    if ($value === null || $value === '') {
                        $this->addError($field, "Le champ $field est requis");
                        break;
                    }
                }
                
                if (strpos($rule, 'min:') === 0) {
                    $min = (int) str_replace('min:', '', $rule);
                    if (strlen($value) < $min) {
                        $this->addError($field, "Le champ $field doit contenir au moins $min caractères");
                    }
                }
                
                if (strpos($rule, 'max:') === 0) {
                    $max = (int) str_replace('max:', '', $rule);
                    if (strlen($value) > $max) {
                        $this->addError($field, "Le champ $field ne peut pas dépasser $max caractères");
                    }
                }
                
                if ($rule === 'email') {
                    if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                        $this->addError($field, "Le champ $field doit être un email valide");
                    }
                }
                
                if ($rule === 'numeric') {
                    if (!is_numeric($value)) {
                        $this->addError($field, "Le champ $field doit être un nombre");
                    }
                }
                
                if (strpos($rule, 'integer') === 0) {
                    if (!filter_var($value, FILTER_VALIDATE_INT)) {
                        $this->addError($field, "Le champ $field doit être un entier");
                    }
                }
                
                if (strpos($rule, 'unique:') === 0) {
                    $parts = explode(',', str_replace('unique:', '', $rule));
                    $table = $parts[0];
                    $column = $parts[1] ?? $field;
                    
                    if ($this->isUnique($table, $column, $value)) {
                        $this->addError($field, "La valeur du champ $field existe déjà");
                    }
                }
                
                if (strpos($rule, 'same:') === 0) {
                    $otherField = str_replace('same:', '', $rule);
                    if ($value !== ($data[$otherField] ?? null)) {
                        $this->addError($field, "Le champ $field doit correspondre à $otherField");
                    }
                }
                
                if ($rule === 'date') {
                    if (!strtotime($value)) {
                        $this->addError($field, "Le champ $field doit être une date valide");
                    }
                }
            }
        }
        
        return $this->errors;
    }
    
    private function addError($field, $message) {
        $this->errors[$field][] = $message;
    }
    
    private function isUnique($table, $column, $value) {
        try {
            $query = "SELECT COUNT(*) FROM $table WHERE $column = :value";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':value', $value);
            $stmt->execute();
            
            return $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            error_log("Erreur vérification unicité: " . $e->getMessage());
            return false;
        }
    }
    
    public function getErrors() {
        return $this->errors;
    }
    
    public function passes() {
        return empty($this->errors);
    }
}
?>