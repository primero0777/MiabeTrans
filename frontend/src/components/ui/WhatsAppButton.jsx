import { useState, useRef, useEffect } from 'react';
import './WhatsAppButton.css';

const WA_NUMBER  = '22897427597';
const API_BASE   = import.meta.env.VITE_API_URL || 'http://localhost/miabetrans/backend/api';

const QA = [
  {
    label: '🎫 Réserver un billet',
    answer: `Pour réserver un billet MiabeTrans :\n1. Allez dans **Rechercher** et entrez votre trajet\n2. Choisissez un horaire disponible\n3. Créez un compte ou connectez-vous\n4. Payez en ligne (Mobile Money, carte) ou en espèces à bord\n\nVotre réservation est confirmée instantanément par email. 🎉`,
  },
  {
    label: '❓ Infos sur un trajet',
    answer: `Retrouvez toutes les infos sur vos trajets depuis la page **Rechercher** :\n• Horaires de départ et d'arrivée\n• Prix du billet\n• Distance et durée estimée\n• Type de bus disponible\n\nNos bus partent du **Boulevard du Mono, Lomé**. L'adresse exacte figure aussi sur votre reçu.`,
  },
  {
    label: '❌ Annuler ma réservation',
    answer: `Pour annuler une réservation :\n1. Connectez-vous à votre espace **Mon compte**\n2. Allez dans **Mes réservations**\n3. Cliquez sur la réservation et choisissez **Annuler**\n\nL'annulation est gratuite jusqu'à **2h avant le départ**. Au-delà, des frais peuvent s'appliquer. Contactez-nous sur WhatsApp pour toute urgence.`,
  },
  {
    label: '🔍 Suivi de réservation',
    answer: `Pour suivre votre réservation :\n• Connectez-vous et allez dans **Mes réservations**\n• Consultez le statut : *en attente*, *confirmée*, *annulée*\n• Votre **numéro de référence** est dans l'email de confirmation\n\nEn cas de problème, présentez ce numéro à notre équipe ou au chauffeur le jour du départ.`,
  },
  { label: '💬 Autre question', input: true },
];

/* ─── Helpers ─── */
function blobToFile(blob) {
  const ext  = blob.type.includes('ogg') ? 'ogg' : blob.type.includes('mp4') ? 'mp4' : 'webm';
  return new File([blob], `message-vocal-miabetrans.${ext}`, { type: blob.type });
}

function downloadBlob(blob) {
  const url = URL.createObjectURL(blob);
  const a   = Object.assign(document.createElement('a'), { href: url, download: blobToFile(blob).name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function WhatsAppButton() {
  const [open, setOpen]         = useState(false);
  const [selected, setSelected] = useState(null);
  const [inputView, setInputView] = useState(false);

  /* saisie texte */
  const [message, setMessage]   = useState('');

  /* enregistrement audio */
  const [recPhase, setRecPhase]     = useState('idle'); // 'idle' | 'recording' | 'done' | 'uploading'
  const [audioBlob, setAudioBlob]   = useState(null);
  const [audioURL,  setAudioURL]    = useState('');
  const [recSeconds, setRecSeconds] = useState(0);
  const [recError,  setRecError]    = useState('');
  const [shareHint, setShareHint]   = useState('');

  const mediaRecRef  = useRef(null);
  const chunksRef    = useRef([]);
  const streamRef    = useRef(null);
  const timerRef     = useRef(null);
  const textareaRef  = useRef(null);

  const openWA = (msg) => {
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    handleClose();
  };

  const handleClose = () => {
    stopRecording();
    setOpen(false); setSelected(null); setInputView(false);
    setMessage(''); resetAudio(); setRecError(''); setShareHint('');
  };

  const resetAudio = () => {
    if (audioURL) URL.revokeObjectURL(audioURL);
    setAudioBlob(null); setAudioURL(''); setRecPhase('idle'); setRecSeconds(0);
  };

  const handleToggle = () => { if (open) handleClose(); else setOpen(true); };

  const handleSelect = (q) => {
    if (q.input) { setInputView(true); return; }
    setSelected(q);
  };

  /* ── Enregistrement audio réel ── */
  const startRecording = async () => {
    setRecError(''); setShareHint(''); resetAudio();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
          ? 'audio/ogg;codecs=opus'
          : '';

      const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecRef.current = rec;

      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        setRecPhase('done');
        stream.getTracks().forEach(t => t.stop());
      };

      rec.start(200);
      setRecPhase('recording');
      setRecSeconds(0);
      timerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
    } catch (e) {
      setRecError(
        e.name === 'NotAllowedError'
          ? 'Accès au micro refusé. Autorisez le micro dans votre navigateur.'
          : 'Impossible d\'accéder au microphone. Vérifiez vos paramètres.'
      );
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    if (mediaRecRef.current?.state === 'recording') mediaRecRef.current.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  /* ── Envoi texte ── */
  const sendText = () => {
    if (!message.trim()) return;
    openWA(`Bonjour MiabeTrans, j'ai une question :\n\n${message.trim()}`);
  };

  /* ── Envoi audio : upload sur le serveur → URL → WhatsApp ── */
  const sendAudio = async () => {
    if (!audioBlob) return;
    setRecError('');

    /* 1. Essayer Web Share API sur mobile (partage direct, sans upload) */
    const file = blobToFile(audioBlob);
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Message vocal MiabeTrans' });
        handleClose();
        return;
      } catch (e) {
        if (e.name === 'AbortError') return; // annulé par l'utilisateur
        // sinon, continuer vers l'upload serveur
      }
    }

    /* 2. Upload sur le backend → obtenir URL publique → WhatsApp */
    setRecPhase('uploading');
    try {
      const formData = new FormData();
      formData.append('audio', file);

      const res  = await fetch(`${API_BASE}/voice`, { method: 'POST', body: formData });
      const json = await res.json();

      if (!res.ok || !json.success) throw new Error(json.message || 'Erreur serveur');

      const audioLink = json.data.url;
      openWA(
        `Bonjour MiabeTrans, j'ai un message vocal pour vous :\n\n🎤 ${audioLink}\n\n(Lien valable 2 heures)`
      );
    } catch (err) {
      setRecPhase('done');
      setRecError('Envoi impossible. Vérifiez votre connexion et réessayez.');
    }
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  useEffect(() => {
    if (inputView && textareaRef.current) setTimeout(() => textareaRef.current?.focus(), 80);
  }, [inputView]);

  useEffect(() => () => { stopRecording(); if (audioURL) URL.revokeObjectURL(audioURL); }, []);

  return (
    <div className="wa-container">
      {open && (
        <div className="wa-popup">

          {/* Header */}
          <div className="wa-popup-header">
            <div className="wa-avatar">🚌</div>
            <div>
              <div className="wa-name">MiabeTrans</div>
              <div className="wa-status">🟢 En ligne</div>
            </div>
            <button className="wa-close" onClick={handleClose} aria-label="Fermer">✕</button>
          </div>

          {/* Body */}
          <div className="wa-popup-body">

            {/* Vue liste */}
            {!selected && !inputView && (
              <>
                <div className="wa-bubble">👋 Bonjour ! Comment puis-je vous aider ?</div>
                <div className="wa-quick-replies">
                  {QA.map((q, i) => (
                    <button key={i} className="wa-reply" onClick={() => handleSelect(q)}>{q.label}</button>
                  ))}
                </div>
              </>
            )}

            {/* Vue réponse */}
            {selected && (
              <div className="wa-answer-view">
                <div className="wa-bubble">👋 Bonjour ! Comment puis-je vous aider ?</div>
                <div className="wa-bubble wa-bubble--user">{selected.label}</div>
                <div className="wa-bubble wa-bubble--answer">
                  {selected.answer.split('\n').map((line, i) => {
                    const html = line
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.+?)\*/g, '<em>$1</em>');
                    return <p key={i} dangerouslySetInnerHTML={{ __html: html }} />;
                  })}
                </div>
                <div className="wa-answer-actions">
                  <button className="wa-reply wa-reply--back" onClick={() => setSelected(null)}>← Autre question</button>
                  <button className="wa-reply wa-reply--wa" onClick={() => openWA(`Bonjour MiabeTrans, j'ai une question concernant : ${selected.label}`)}>
                    💬 Contacter sur WhatsApp
                  </button>
                </div>
              </div>
            )}

            {/* Vue saisie — Autre question */}
            {inputView && (
              <div className="wa-input-view">
                <div className="wa-bubble">
                  Écrivez votre question <strong>ou enregistrez un message vocal</strong> dans votre langue.
                </div>

                {/* Zone texte */}
                {recPhase === 'idle' && (
                  <textarea
                    ref={textareaRef}
                    className="wa-textarea"
                    placeholder="Tapez votre question ici…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                  />
                )}

                {/* Enregistrement en cours */}
                {recPhase === 'recording' && (
                  <div className="wa-rec-active">
                    <div className="wa-rec-waves">
                      <span /><span /><span /><span /><span />
                    </div>
                    <span className="wa-rec-timer">{fmt(recSeconds)}</span>
                    <span className="wa-rec-label">Parlez…</span>
                  </div>
                )}

                {/* Aperçu audio après enregistrement */}
                {(recPhase === 'done' || recPhase === 'uploading') && audioURL && (
                  <div className="wa-audio-preview">
                    <audio controls src={audioURL} className="wa-audio-player" />
                    {recPhase === 'done' && (
                      <button className="wa-retake" onClick={() => { resetAudio(); }}>
                        🔄 Réenregistrer
                      </button>
                    )}
                    {recPhase === 'uploading' && (
                      <div className="wa-uploading">
                        <span className="wa-upload-dot" /><span className="wa-upload-dot" /><span className="wa-upload-dot" />
                        Envoi en cours…
                      </div>
                    )}
                  </div>
                )}

                {/* Erreur micro */}
                {recError && <div className="wa-voice-error">{recError}</div>}

                {/* Hint partage */}
                {shareHint && <div className="wa-share-hint">{shareHint}</div>}

                {/* Actions */}
                <div className="wa-input-actions">
                  {/* Retour */}
                  <button className="wa-reply wa-reply--back wa-reply--sm"
                    onClick={() => { stopRecording(); resetAudio(); setInputView(false); setMessage(''); setRecError(''); }}>
                    ←
                  </button>

                  {/* Micro : démarrer / arrêter */}
                  {recPhase !== 'done' && (
                    <button
                      className={`wa-mic-btn ${recPhase === 'recording' ? 'recording' : ''}`}
                      onClick={recPhase === 'recording' ? stopRecording : startRecording}
                      title={recPhase === 'recording' ? 'Arrêter' : 'Enregistrer un message vocal'}
                    >
                      {recPhase === 'recording' ? (
                        /* Icône stop */
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="5" y="5" width="14" height="14" rx="2"/>
                        </svg>
                      ) : (
                        /* Icône micro */
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
                        </svg>
                      )}
                    </button>
                  )}

                  {/* Envoyer texte */}
                  {recPhase !== 'recording' && recPhase !== 'done' && (
                    <button className="wa-send-btn" onClick={sendText} disabled={!message.trim()}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                      Envoyer
                    </button>
                  )}

                  {/* Envoyer message vocal */}
                  {(recPhase === 'done' || recPhase === 'uploading') && (
                    <button className="wa-send-btn wa-send-btn--audio" onClick={sendAudio} disabled={recPhase === 'uploading'}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Envoyer sur WhatsApp
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Bouton flottant */}
      <button className={`wa-btn ${open ? 'open' : ''}`} onClick={handleToggle} aria-label="Chat WhatsApp">
        {open ? '✕' : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        )}
        {!open && <span className="wa-badge">1</span>}
      </button>
    </div>
  );
}
