import test from 'node:test';import assert from 'node:assert/strict';import {parsePatch,offset} from '../src/patch.mjs';
const headers='--- a/demo.txt\n+++ b/demo.txt\n';
test('parses paired headers, omitted one counts and newline markers',()=>{const p=parsePatch(headers+'@@ -1 +1 @@\n-old\n\\ No newline at end of file\n+new\n');assert.equal(p.hunks[0].oldCount,1);assert.equal(p.hunks[0].lines[0].noNewline,true);assert.equal(p.hunks[0].lines[1].noNewline,false);});
test('zero-length ranges address boundaries',()=>{assert.equal(offset(0,0),0);assert.equal(offset(3,0),3);assert.equal(offset(3,1),2);});
test('rejects malformed counts, overlapping hunks and unsupported extra files',()=>{for(const body of ['@@ -1,2 +1 @@\n-a\n+b','@@ -0 +1 @@\n-a\n+b','@@ -1 +1 @@\n-a\n+b\n--- x\n+++ y','@@ -1 +1 @@\n-a\n+b\n@@ -1 +1 @@\n-a\n+b'])assert.throws(()=>parsePatch(headers+body));});
test('rejects oversized, CRLF, NUL and empty patches',()=>{for(const text of ['',headers,headers.replaceAll('\n','\r\n'),'a'.repeat(100001),'a\0'])assert.throws(()=>parsePatch(text));});
