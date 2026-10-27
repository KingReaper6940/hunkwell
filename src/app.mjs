import {parsePatch} from './patch.mjs';import {reversePatch} from './apply.mjs';import {EXAMPLE,inspect,projectJSON,parseProject,reportJSON} from './files.mjs';
const $=id=>document.getElementById(id),el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
let report=null;
function message(text,error=false){$('status').textContent=text;$('status').className=error?'error':'';}
function counts(){for(const id of ['source','patch'])$(id+'-count').textContent=$(id).value.length.toLocaleString()+' UTF-16 units';}
function invalidate(){report=null;$('review').hidden=true;$('output').value='';$('hunks').replaceChildren();counts();message('Inputs changed. Check the patch to produce a new result.');refreshExports();}
function run(){
 invalidate();
 try{
  report=inspect($('source').value,$('patch').value,$('direction').value);
  const original=parsePatch($('patch').value),patch=$('direction').value==='reverse'?reversePatch(original):original;
  $('review').hidden=false;$('badge').textContent=report.ok?'All hunks matched':'Conflict · no output';$('summary').replaceChildren();
  for(const [value,label] of [[report.hunks.length,'hunks'],[report.hunks.reduce((n,h)=>n+h.added,0),'added lines'],[report.hunks.reduce((n,h)=>n+h.removed,0),'removed lines']]){const block=el('div');block.append(el('strong','',String(value)),el('span','',label));$('summary').append(block);}
  const conflict=$('conflict');conflict.replaceChildren();conflict.hidden=report.ok;
  if(!report.ok){const c=report.conflict;conflict.append(el('h3','','Hunk '+c.hunk+' · check stopped'),el('p','',c.reason));if(c.sourceLine){conflict.append(el('p','','Source line '+c.sourceLine+' · expected final newline: '+c.expectedNewline+' · actual: '+c.actualNewline),el('pre','','Expected: '+JSON.stringify(c.expected)+'\nActual:   '+JSON.stringify(c.actual)));}conflict.append(el('p','','Earlier receipts indicate matched checks only. No partial resulting text is available.'));}
  $('hunks').replaceChildren();
  for(const [i,h] of patch.hunks.entries()){const details=el('details','hunk'),summary=el('summary','','Hunk '+(i+1)+' · @@ -'+h.oldStart+','+h.oldCount+' +'+h.newStart+','+h.newCount+' @@'),pre=el('pre');for(const line of h.lines){pre.append(el('span','diff-line '+(line.kind==='+'?'added':line.kind==='-'?'removed':''),line.kind+line.text));if(line.noNewline)pre.append(el('span','diff-line','\\ No newline at end of file'));}details.append(summary,pre);$('hunks').append(details);}
  $('output').value=report.ok?report.output:'';$('output-note').textContent=report.ok?(report.reverseVerified?'Reverse check restores the supplied source.':'Reverse check did not restore the source.'):'Unavailable until every check passes.';
  message(report.ok?'All hunks match exactly. Review the result before using it.':'Conflict found. The source is unchanged and no output was released.',!report.ok);
 }catch(error){report=null;$('review').hidden=true;message(error.message,true);}
 refreshExports();
}
for(const id of ['source','patch','direction'])$(id).addEventListener('input',invalidate);
$('run').addEventListener('click',run);$('example').addEventListener('click',()=>{for(const id of ['source','patch','direction'])$(id).value=EXAMPLE[id];run();});
initializeExports();for(const id of ['source','patch','direction'])$(id).value=EXAMPLE[id];counts();run();

function download(text,name,type){const url=URL.createObjectURL(new Blob([text],{type:type+';charset=utf-8',endings:'transparent'})),link=el('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function refreshExports(){
 if(!$('download-result'))return;
 $('download-result').disabled=!report?.ok||!report.reverseVerified;$('download-report').disabled=!report;$('save-project').disabled=!report;
 $('report-preview').value=report?reportJSON(report):'';$('project-preview').value=report?projectJSON($('source').value,$('patch').value,$('direction').value):'';
}
function initializeExports(){
 const actions=el('div','downloads'),result=el('button','','Save resulting text ↓'),receipt=el('button','','Save check receipt JSON ↓');result.id='download-result';receipt.id='download-report';
 result.addEventListener('click',()=>{if(report?.ok&&report.reverseVerified)download(report.output,'hunkwell-result.txt','text/plain');});
 receipt.addEventListener('click',()=>{if(report)download(reportJSON(report),'hunkwell-receipt.json','application/json');});actions.append(result,receipt);$('export-slot').append(actions);
 const save=el('button','','Save editable project ↓');save.id='save-project';save.addEventListener('click',()=>{if(report)download(projectJSON($('source').value,$('patch').value,$('direction').value),'hunkwell-project.json','application/json');});
 $('project-slot').append(save);
 for(const [id,title,label] of [['report-preview','Inspect check receipt JSON','Check receipt JSON'],['project-preview','Inspect editable project JSON','Editable project JSON']]){
  const details=el('details'),summary=el('summary','',title),area=el('textarea');area.id=id;area.readOnly=true;area.setAttribute('aria-label',label);details.append(summary,area);$('project-slot').append(details);
 }
 const reopen=el('details'),summary=el('summary','','Reopen a saved project'),label=el('label','','Paste Hunkwell project JSON'),area=el('textarea');area.id='project-input';area.spellcheck=false;label.htmlFor=area.id;
 const load=el('button','','Load pasted project');load.addEventListener('click',()=>{try{const p=parseProject(area.value);for(const id of ['source','patch','direction'])$(id).value=p[id];area.value='';run();}catch(error){message(error.message,true);}});
 reopen.append(summary,label,area,load);$('project-slot').append(reopen);
}
