function reportText(data){
  const m=data.match, periods={'1':'1° tempo','2':'2° tempo','3':'1° supplementare','4':'2° supplementare'};
  const lines=['BORDO CAMPO - DIARIO DI GARA','',`${m.home||'Casa'} - ${m.away||'Ospiti'}`,`Arbitro: ${m.referee||'-'}`,`Categoria: ${m.category||'-'}`,`Data: ${m.date?m.date.split('-').reverse().join('/'):'-'}   Ora: ${m.time||'-'}`,`Campo: ${m.venue||'-'}`,'','ANNOTAZIONI',''];
  if(!data.events.length)lines.push('Nessuna annotazione.');
  data.events.slice().reverse().forEach(e=>{
    lines.push(`${e.minute}' (${periods[e.period]||e.period}) - ${e.kind==='disciplina'?e.sanction:e.kind==='sostituzione'?'Sostituzione':'Episodio'}`);
    if(e.team)lines.push(`Squadra: ${m[e.team]||(e.team==='home'?'Casa':'Ospiti')}`);
    if(e.kind==='disciplina'&&e.player)lines.push(`Calciatore n° ${e.player}`);
    if(e.kind==='sostituzione')lines.push(`Esce n° ${e.out||'-'} / Entra n° ${e.in||'-'}`);
    if(e.note)lines.push(e.note);
    lines.push('');
  });
  const drafts=Object.entries(data.drafts||{});
  if(drafts.length){lines.push('BOZZE NON ANCORA CONFERMATE','');for(const [kind,e] of drafts){lines.push(`${e.minute||'-'}' (${periods[e.period]||'-'}) - Bozza ${kind}`);if(e.team)lines.push(`Squadra: ${m[e.team]||e.team}`);if(kind==='disciplina')lines.push(`${e.sanction||''} - n° ${e.player||'-'}`);if(kind==='sostituzione')lines.push(`Esce n° ${e.out||'-'} / Entra n° ${e.in||'-'}`);lines.push(e.note||'', '')}}
  return lines.join('\n');
}
// Self-contained PDF: fixed-width text, automatic wrapping and A4 pagination.
function reportPDF(text){
  const encode=s=>Array.from(s.replace(/[‘’′]/g,"'").replace(/[“”]/g,'"').replace(/[–—]/g,'-').replace(/→/g,'>')).map(c=>{let n=c.charCodeAt(0);return (n>=32&&n<=255?n:63).toString(16).padStart(2,'0')}).join('');
  const lines=[];
  for(const paragraph of text.split('\n')){
    let remaining=paragraph.replace(/\t/g,'    ');
    while(remaining.length>82){let cut=remaining.lastIndexOf(' ',82);if(cut<1)cut=82;lines.push(remaining.slice(0,cut));remaining=remaining.slice(cut).replace(/^ /,'')}
    lines.push(remaining);
  }
  const pages=[];for(let i=0;i<lines.length;i+=48)pages.push(lines.slice(i,i+48));
  const objects=['<< /Type /Catalog /Pages 2 0 R >>','', '<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>'];
  const refs=[];
  pages.forEach((page,index)=>{
    const pageId=objects.length+1,streamId=pageId+1;refs.push(pageId+' 0 R');
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 3 0 R >> >> /Contents ${streamId} 0 R >>`);
    const stream='BT /F1 10 Tf 14 TL 48 790 Td\n'+page.map(line=>'<'+encode(line)+'> Tj T*').join('\n')+'\nET\nBT /F1 9 Tf 48 42 Td <'+encode(`Bordo campo | Pagina ${index+1} di ${pages.length}`)+'> Tj ET\n';
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
  });
  objects[1]=`<< /Type /Pages /Count ${pages.length} /Kids [${refs.join(' ')}] >>`;
  let pdf='%PDF-1.4\n',offsets=[0];objects.forEach((o,i)=>{offsets.push(pdf.length);pdf+=`${i+1} 0 obj\n${o}\nendobj\n`});
  const xref=pdf.length;pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('');
  pdf+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;return new Blob([pdf],{type:'application/pdf'});
}
