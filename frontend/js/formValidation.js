// Système de validation de formulaires MiabeTrans
class FormValidator {
    constructor(formId, options = {}) {
        this.form = document.getElementById(formId);
        this.fields = {};
        this.options = {
            realTime: true,
            showErrors: true,
            ...options
        };
        
        if (this.form) {
            this.init();
        }
    }

    init() {
        // Récupérer tous les champs avec des attributs de validation
        const fields = this.form.querySelectorAll('[data-validate]');
        
        fields.forEach(field => {
            const fieldName = field.name;
            const rules = field.getAttribute('data-validate').split('|');
            
            this.fields[fieldName] = {
                element: field,
                rules: rules,
                errors: []
            };

            // Événements de validation en temps réel
            if (this.options.realTime) {
                field.addEventListener('blur', () => this.validateField(fieldName));
                field.addEventListener('input', () => this.clearFieldError(fieldName));
            }
        });

        // Validation à la soumission
        this.form.addEventListener('submit', (e) => {
            if (!this.validateForm()) {
                e.preventDefault();
                this.showFormErrors();
            }
        });
    }

    validateForm() {
        let isValid = true;
        
        Object.keys(this.fields).forEach(fieldName => {
            if (!this.validateField(fieldName)) {
                isValid = false;
            }
        });

        return isValid;
    }

    validateField(fieldName) {
        const field = this.fields[fieldName];
        const value = field.element.value.trim();
        field.errors = [];

        field.rules.forEach(rule => {
            const error = this.checkRule(rule, value, fieldName);
            if (error) {
                field.errors.push(error);
            }
        });

        if (field.errors.length > 0 && this.options.showErrors) {
            this.showFieldError(fieldName);
        } else {
            this.clearFieldError(fieldName);
        }

        return field.errors.length === 0;
    }

    checkRule(rule, value, fieldName) {
        const [ruleName, ruleValue] = rule.split(':');
        
        switch (ruleName) {
            case 'required':
                if (!value) return 'Ce champ est obligatoire';
                break;
                
            case 'min':
                if (value.length < parseInt(ruleValue)) {
                    return `Doit contenir au moins ${ruleValue} caractères`;
                }
                break;
                
            case 'max':
                if (value.length > parseInt(ruleValue)) {
                    return `Ne peut pas dépasser ${ruleValue} caractères`;
                }
                break;
                
            case 'email':
                if (value && !this.isValidEmail(value)) {
                    return 'Adresse email invalide';
                }
                break;
                
            case 'phone':
                if (value && !this.isValidPhone(value)) {
                    return 'Numéro de téléphone invalide';
                }
                break;
                
            case 'numeric':
                if (value && !this.isNumeric(value)) {
                    return 'Doit être un nombre';
                }
                break;
                
            case 'same':
                const otherField = this.fields[ruleValue];
                if (otherField && value !== otherField.element.value) {
                    return `Doit correspondre à ${this.getFieldLabel(ruleValue)}`;
                }
                break;
                
            case 'password':
                if (value && !this.isStrongPassword(value)) {
                    return 'Le mot de passe doit contenir au moins 6 caractères, une majuscule et un chiffre';
                }
                break;
        }
        
        return null;
    }

    showFieldError(fieldName) {
        const field = this.fields[fieldName];
        const errorMessage = field.errors[0];
        
        // Supprimer l'erreur précédente
        this.clearFieldError(fieldName);
        
        // Ajouter la classe d'erreur
        field.element.classList.add('error');
        
        // Créer le message d'erreur
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = errorMessage;
        errorElement.style.cssText = `
            color: #ef4444;
            font-size: 0.875rem;
            margin-top: 0.25rem;
            display: block;
        `;
        
        field.element.parentNode.appendChild(errorElement);
    }

    clearFieldError(fieldName) {
        const field = this.fields[fieldName];
        field.element.classList.remove('error');
        
        const existingError = field.element.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    showFormErrors() {
        // Faire défiler jusqu'au premier champ en erreur
        const firstErrorField = Object.values(this.fields).find(field => field.errors.length > 0);
        if (firstErrorField) {
            firstErrorField.element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            firstErrorField.element.focus();
        }
    }

    // Méthodes de validation
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^(\+228|00228)?[0-9]{8}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    isNumeric(value) {
        return !isNaN(value) && !isNaN(parseFloat(value));
    }

    isStrongPassword(password) {
        return password.length >= 6 && 
               /[A-Z]/.test(password) && 
               /[0-9]/.test(password);
    }

    getFieldLabel(fieldName) {
        const field = this.fields[fieldName];
        const label = field.element.closest('.form-group')?.querySelector('label');
        return label?.textContent?.replace('*', '').trim() || fieldName;
    }

    // Méthodes utilitaires
    resetForm() {
        this.form.reset();
        Object.keys(this.fields).forEach(fieldName => {
            this.clearFieldError(fieldName);
        });
    }

    getFieldValue(fieldName) {
        return this.fields[fieldName]?.element.value || '';
    }

    setFieldValue(fieldName, value) {
        if (this.fields[fieldName]) {
            this.fields[fieldName].element.value = value;
        }
    }

    // Validation asynchrone (pour vérifications serveur)
    async validateAsync(fieldName, validator) {
        const value = this.getFieldValue(fieldName);
        try {
            const isValid = await validator(value);
            if (!isValid) {
                this.fields[fieldName].errors.push('Validation échouée');
                this.showFieldError(fieldName);
            }
            return isValid;
        } catch (error) {
            this.fields[fieldName].errors.push('Erreur de validation');
            this.showFieldError(fieldName);
            return false;
        }
    }
}

// Utilisation globale
const formValidators = {};

function initFormValidation(formId, options = {}) {
    formValidators[formId] = new FormValidator(formId, options);
    return formValidators[formId];
}

// CSS pour la validation
const validationStyles = `
.form-group .error {
    border-color: #ef4444 !important;
    background-color: #fef2f2;
}

.error-message {
    color: #ef4444;
    font-size: 0.875rem;
    margin-top: 0.25rem;
    display: block;
}

.form-group.success .form-input {
    border-color: #10b981 !important;
}

.success-message {
    color: #10b981;
    font-size: 0.875rem;
    margin-top: 0.25rem;
    display: block;
}
`;

// Injecter les styles
const styleSheet = document.createElement('style');
styleSheet.textContent = validationStyles;
document.head.appendChild(styleSheet);