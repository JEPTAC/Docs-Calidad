/* V84 · jerarquía DOCX: los encabezados visuales no desplazan el padre semántico.
   Esto evita que encabezados hermanos guardados como Normal/List Paragraph se aniden
   artificialmente unos dentro de otros.
*/
function v84AdvancesStructuralLevel(meta){return !!meta?.heading && Number(meta.confidence||0)>.85}
const v84ReadDocxOoxmlPrevious=v84ReadDocxOoxml;
v84ReadDocxOoxml=async function(file){
  const JSZip=await v84EnsureJsZip(),zip=await JSZip.loadAsync(await file.arrayBuffer());
  const docText=await zip.file('word/document.xml')?.async('text');
  if(!docText)throw new Error('El DOCX no contiene word/document.xml.');
  const stylesText=await zip.file('word/styles.xml')?.async('text'),numberingText=await zip.file('word/numbering.xml')?.async('text');
  const documentXml=v84ParseXml(docText),styles=v84StylesMap(stylesText?v84ParseXml(stylesText):null),numbering=v84NumberingMap(numberingText?v84ParseXml(numberingText):null),numState=new Map(),body=v84First(documentXml,'body'),blocks=[],tables=[],headings=[];
  let structuralLevel=1,seenHeading=false,documentTitle='';
  if(!body)throw new Error('No se encontró el cuerpo del documento.');
  for(const child of [...body.children]){
    if(child.localName==='tbl'){
      const rows=v84TableRows(child);
      if(rows.length){tables.push(rows);v84PushBlock(blocks,eiAiBlock('table','',{rows,source:'docx:ooxml'}))}
      continue;
    }
    if(child.localName!=='p')continue;
    const meta=v84ParagraphMeta(child,styles,numbering,numState,structuralLevel);
    if(!meta.rawText)continue;
    if(/^TOC\s*\d*$/i.test(meta.style.name)||/^Tabla de contenido/i.test(meta.style.name))continue;
    if(!seenHeading&&meta.boldRatio>=.8&&meta.align==='center'&&v84AllCaps(meta.rawText)&&/MANUAL|PROCEDIMIENTO|INSTRUCTIVO|GU[IÍ]A|INFORME/.test(meta.rawText.toUpperCase())){documentTitle=meta.rawText;continue}
    if(meta.heading){
      seenHeading=true;
      if(v84AdvancesStructuralLevel(meta))structuralLevel=meta.heading;
      const b=eiAiBlock('heading',meta.text,{level:meta.heading,source:meta.source,confidence:meta.confidence});
      b.numberLabel=meta.num?.kind==='number'?meta.num.label:'';b.styleName=meta.style.name;
      headings.push({level:b.level,text:b.text,numberLabel:b.numberLabel});v84PushBlock(blocks,b);continue;
    }
    if(meta.num?.kind==='bullet'){v84PushBlock(blocks,eiAiBlock('list',meta.rawText,{ordered:false,source:`docx:list:${meta.style.name}`}));continue}
    if(meta.num?.kind==='number'){v84PushBlock(blocks,eiAiBlock('list',meta.rawText,{ordered:true,source:`docx:list:${meta.style.name}`}));continue}
    v84PushBlock(blocks,eiAiBlock('paragraph',meta.rawText,{source:meta.source}));
  }
  const normalized=eiAiNormalizeBlocks(blocks);
  return{text:eiAiBlocksPlainText(normalized),blocks:normalized,headings,tables,tableNames:tables.map((_,i)=>`Tabla ${i+1}`),pages:null,warnings:[],documentTitle,parser:'ooxml-v84'};
};
window.EI_AI_V84_HIERARCHY_READY=true;
