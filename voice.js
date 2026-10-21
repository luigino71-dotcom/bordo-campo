// The microphone belongs exclusively to the open annotation form.
(()=>{
  const dialog=document.querySelector('#eventDialog'),form=document.querySelector('#eventForm');
  const button=document.querySelector('#dictate'),note=form.elements.note;
  const status=document.querySelector('#voiceStatus'),submit=form.querySelector('button.primary');
  const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
  let current=null;
  function idle(){button.setAttribute('aria-pressed','false');button.setAttribute('aria-label','Detta negli appunti di questa nota');button.disabled=false;submit.disabled=false}
  function cancel(){if(!current)return;const session=current;current=null;try{session.recognition.abort()}catch{}idle();status.textContent='Dettatura interrotta. Il testo già scritto resta nella bozza.'}
  function stop(){if(!current)return;button.disabled=true;status.textContent='Conclusione della dettatura…';try{current.recognition.stop()}catch{cancel()}}
  if(!Speech){button.disabled=true;status.textContent='Dettatura non disponibile qui. Su iPhone apri in Safari oppure usa il microfono della tastiera.';return}
  button.addEventListener('click',()=>{
    if(!dialog.open)return;
    if(current){stop();return}
    const recognition=new Speech(),session={recognition,seen:new Set(),failed:false,hasText:false};
    current=session;recognition.lang='it-IT';recognition.continuous=true;recognition.interimResults=true;
    button.setAttribute('aria-pressed','true');button.setAttribute('aria-label','Ferma la dettatura');submit.disabled=true;
    status.textContent='Attivazione microfono… Consenti l’accesso se richiesto.';
    recognition.onstart=()=>{if(current===session)status.textContent='In ascolto per questa nota. Tocca di nuovo il microfono per fermare.'};
    recognition.onresult=event=>{
      if(current!==session||!dialog.open)return;
      const interim=[];
      for(let i=event.resultIndex;i<event.results.length;i++){
        const result=event.results[i],text=result[0].transcript.trim();
        if(!result.isFinal){interim.push(text);continue}
        if(session.seen.has(i)||!text)continue;
        session.seen.add(i);session.hasText=true;
        // Append to this form only; preserve anything already typed.
        const separator=note.value&&!/\s$/.test(note.value)?' ':'';
        note.value+=separator+text;
        note.dispatchEvent(new Event('input',{bubbles:true}));
      }
      status.textContent=interim.length?'Sto riconoscendo: '+interim.join(' '):'Testo inserito in questa nota. Tocca il microfono per fermare.';
    };
    recognition.onerror=event=>{
      if(current!==session)return;session.failed=true;
      const messages={'not-allowed':'Microfono o riconoscimento vocale non autorizzato. Consenti l’accesso nelle impostazioni di Safari oppure usa il microfono della tastiera.','service-not-allowed':'Servizio vocale non disponibile. Su iPhone usa Safari e verifica che Siri o Dettatura siano abilitati.','audio-capture':'Microfono non disponibile. Controlla che non sia occupato da un’altra app.','network':'La dettatura richiede una connessione. Il testo già scritto resta salvato.','no-speech':'Non ho sentito parole. Tocca il microfono per riprovare.','language-not-supported':'La lingua italiana non è disponibile per la dettatura di questo browser.'};
      status.textContent=messages[event.error]||'Dettatura interrotta. Puoi riprovare o scrivere con la tastiera.';
      current=null;idle();try{recognition.abort()}catch{}
    };
    recognition.onend=()=>{if(current!==session)return;current=null;idle();if(!session.failed)status.textContent=session.hasText?'Dettatura terminata. Controlla il testo e tocca Salva annotazione.':'Nessun testo riconosciuto. Puoi riprovare o usare la tastiera.'};
    try{recognition.start()}catch{current=null;idle();status.textContent='Impossibile avviare la dettatura. Prova in Safari oppure usa il microfono della tastiera.'}
  });
  dialog.addEventListener('close',cancel);dialog.addEventListener('cancel',cancel);
  form.addEventListener('submit',event=>{if(current){event.preventDefault();event.stopImmediatePropagation();stop()}},true);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')cancel()});
  // On a newly opened note, remove messages belonging to the previous note.
  document.querySelectorAll('[data-kind]').forEach(trigger=>trigger.addEventListener('click',()=>{cancel();status.textContent='Tocca il microfono per dettare solo negli appunti di questa nota. La dettatura può richiedere internet.'}));
})();
