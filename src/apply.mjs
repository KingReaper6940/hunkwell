import {bounded,offset} from './patch.mjs';
export function sourceLines(text){bounded(text,'Source');if(!text)return [];const values=text.split('\n'),final=text.endsWith('\n');if(final)values.pop();return values.map((text,i)=>({text,newline:i<values.length-1||final}));}
export function applyStrict(source,patch){
 const input=sourceLines(source),output=[],receipts=[];let cursor=0;
 const fail=(hunk,reason,details={})=>({ok:false,output:null,receipts,conflict:{hunk,reason,...details}});
 if(patch.oldFile.split('\t')[0]==='/dev/null'&&source!=='')return fail(1,'A /dev/null original header requires empty source.');
 for(const [index,h] of patch.hunks.entries()){
  const at=offset(h.oldStart,h.oldCount);if(at<cursor||at>input.length)return fail(index+1,'Original hunk range is outside or overlaps the source.');
  output.push(...input.slice(cursor,at));cursor=at;
  if(offset(h.newStart,h.newCount)!==output.length)return fail(index+1,'New hunk position does not agree with the preceding changes.');
  for(const line of h.lines){
   if(line.kind!=='+'){
    const actual=input[cursor];if(!actual||actual.text!==line.text||actual.newline===line.noNewline)return fail(index+1,'Source line does not exactly match the patch.',{sourceLine:cursor+1,expected:line.text,actual:actual?.text??null,expectedNewline:!line.noNewline,actualNewline:actual?.newline??null});
    cursor++;
   }
   if(line.kind!=='-')output.push({text:line.text,newline:!line.noNewline});
  }
  receipts.push({hunk:index+1,oldStart:h.oldStart,oldCount:h.oldCount,newStart:h.newStart,newCount:h.newCount,status:'matched'});
 }
 output.push(...input.slice(cursor));
 if(output.slice(0,-1).some(line=>!line.newline))return fail(patch.hunks.length,'A no-newline marker would leave a non-final output line unterminated.');
 const text=output.map(line=>line.text+(line.newline?'\n':'')).join('');
 if(text.length>100000||output.length>5000)return fail(patch.hunks.length,'Output exceeds 100,000 UTF-16 units or 5,000 lines.');
 if(patch.newFile.split('\t')[0]==='/dev/null'&&text!=='')return fail(patch.hunks.length,'A /dev/null new header requires empty output.');
 return {ok:true,output:text,receipts,conflict:null};
}
export function reversePatch(patch){return {...patch,oldFile:patch.newFile,newFile:patch.oldFile,hunks:patch.hunks.map(h=>({...h,oldStart:h.newStart,oldCount:h.newCount,newStart:h.oldStart,newCount:h.oldCount,lines:h.lines.map(line=>({...line,kind:line.kind==='+'?'-':line.kind==='-'?'+':' '}))}))};}
