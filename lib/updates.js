'use strict';
const {t}=require('./i18n');
const repository='https://github.com/Caner-HK/DeskTile-DevKit',api='https://api.github.com/repos/Caner-HK/DeskTile-DevKit';
const packageInfo=require('../package.json');
class UpdateError extends Error{constructor(code,message){super(message);this.code=code;}}
function version(value){if(typeof value!=='string'||!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value))return null;const parts=value.split('.').map(Number);return parts.every(Number.isSafeInteger)?parts:null;}
function compare(a,b){const left=version(a),right=version(b);if(!left||!right)throw new UpdateError('UPDATE_METADATA','Invalid release version.');for(let i=0;i<3;i++)if(left[i]!==right[i])return left[i]>right[i]?1:-1;return 0;}
function releaseUrl(url,download=false){try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&u.origin==='https://github.com'&&u.pathname.startsWith('/Caner-HK/DeskTile-DevKit/releases/'+(download?'download/':'tag/'))&&!u.search&&!u.hash;}catch{return false;}}
async function json(url,options){
 const timeout=new AbortController(),timer=setTimeout(()=>timeout.abort(),options.timeoutMs??10000);timer.unref?.();
 const signal=options.signal?AbortSignal.any([options.signal,timeout.signal]):timeout.signal;
 try{
  const response=await(options.fetch||fetch)(url,{signal,headers:{Accept:'application/vnd.github+json','User-Agent':'DeskTile-DevKit/'+packageInfo.version,'X-GitHub-Api-Version':'2022-11-28'}});
  if(response.status===403||response.status===429)throw new UpdateError('UPDATE_RATE_LIMIT','GitHub request limit reached. Try again later.');
  if(!response.ok)throw new UpdateError('UPDATE_HTTP','GitHub update request failed. Try again later.');
  const maximum=2*1024*1024,reader=response.body?.getReader();let text='';
  if(reader){const chunks=[];let size=0;try{for(;;){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>maximum)throw new UpdateError('UPDATE_METADATA','Release metadata is too large.');chunks.push(Buffer.from(part.value));}}finally{await reader.cancel().catch(()=>{});}text=Buffer.concat(chunks).toString('utf8');}
  else text=await response.text();
  if(Buffer.byteLength(text)>maximum)throw new UpdateError('UPDATE_METADATA','Release metadata is too large.');
  try{return JSON.parse(text);}catch{throw new UpdateError('UPDATE_METADATA','The release metadata could not be read.');}
 }catch(error){
  if(options.signal?.aborted)throw Object.assign(new Error('Operation cancelled.'),{code:'CANCELLED'});
  if(timeout.signal.aborted)throw new UpdateError('UPDATE_TIMEOUT','GitHub update check timed out. Try again.');
  if(error instanceof UpdateError)throw error;
  throw new UpdateError('UPDATE_NETWORK','Could not connect to GitHub. Check your network and try again.');
 }finally{clearTimeout(timer);}
}
async function check(options={}){
 const installed=options.installed||{version:packageInfo.version,toolRevision:packageInfo.desktileSdk.toolRevision,sdk:packageInfo.desktileSdk.default};
 if(!version(installed.version)||!/^\d+\.\d+$/.test(installed.sdk))throw new UpdateError('UPDATE_METADATA','Invalid installed SDK or tool version.');
 let page=1,releases=[];
 for(;;){const batch=await json(api+'/releases?per_page=100&page='+page,options);if(!Array.isArray(batch))throw new UpdateError('UPDATE_METADATA','The release metadata could not be read.');releases.push(...batch);if(batch.length<100)break;if(page++>=10)throw new UpdateError('UPDATE_METADATA','Too many releases to check. Open the releases page.');}
 releases=releases.filter(r=>r&&!r.draft&&!r.prerelease&&typeof r.tag_name==='string'&&version(r.tag_name.replace(/^v/,''))).sort((a,b)=>compare(b.tag_name.replace(/^v/,''),a.tag_name.replace(/^v/,'')));
 if(!releases.length)return {status:'no-releases',installed};
 let incompatible=null,metadataFailure=false;
 for(const release of releases){
  const tagged=release.tag_name.replace(/^v/,'');if(compare(tagged,installed.version)<0)continue;
  const asset=release.assets?.find(a=>a.name==='artifacts.json'&&a.state==='uploaded'&&releaseUrl(a.browser_download_url,true));
  if(!asset||!releaseUrl(release.html_url)){metadataFailure=true;continue;}
  const metadata=await json(asset.browser_download_url,options);
  if(metadata?.version!==tagged||!Number.isSafeInteger(metadata.toolRevision)||metadata.toolRevision<1||!/^\d+\.\d+$/.test(metadata.sdk)||!Array.isArray(metadata.supportedSdks)||!metadata.supportedSdks.length||metadata.supportedSdks.some(s=>typeof s!=='string'||!/^\d+\.\d+$/.test(s))){metadataFailure=true;continue;}
  const result={version:metadata.version,toolRevision:metadata.toolRevision,sdk:metadata.sdk,supportedSdks:metadata.supportedSdks,url:release.html_url};
  const installer=release.assets.find(a=>a.name==='desktile-devkit-'+metadata.version+'-win32-x64.vsix'&&a.state==='uploaded'&&releaseUrl(a.browser_download_url,true));
  if(installer)result.download=installer.browser_download_url;
  if(!metadata.supportedSdks.includes(installed.sdk)){incompatible??=result;continue;}
  if(compare(metadata.version,installed.version)>0&&installer)return {status:'available',installed,release:result};
  if(compare(metadata.version,installed.version)===0)return {status:'current',installed,...(incompatible?{otherSdk:incompatible}:{})};
  metadataFailure=true;
 }
 if(metadataFailure)throw new UpdateError('UPDATE_METADATA','A release is missing valid version metadata or an installable VSIX. Open the releases page.');
 return {status:incompatible?'incompatible':'current',installed,...(incompatible?{otherSdk:incompatible}:{})};
}
function describe(result){
 const releases=t('Open releases'),notes=t('Release notes'),download=t('Download VSIX');let message,actions=[releases];
 if(result.status==='available'){const r=result.release;message=t('Update available: SDK {0}, Tools {1} ({2}). Supports your SDK {3}.',r.sdk,r.toolRevision,r.version,result.installed.sdk);actions=[download,notes];}
 else if(result.status==='no-releases')message=t('No stable DeskTile DevKit release has been published.');
 else if(result.status==='incompatible')message=t('No newer tools support SDK {0}. A release for SDK {1} is available.',result.installed.sdk,result.otherSdk.sdk);
 else message=t('DeskTile DevKit {0} is up to date for SDK {1} (Tools {2}).',result.installed.version,result.installed.sdk,result.installed.toolRevision);
 return {message,actions:actions.map(label=>({id:label===download?'download':label===notes?'notes':'releases',label,url:result.status==='available'?(label===download?result.release.download:result.release.url):repository+'/releases'}))};
}
async function present(vscode,result){
 const view=describe(result),selected=await vscode.window.showInformationMessage(view.message,...view.actions.map(action=>action.label));
 const action=view.actions.find(action=>action.label===selected);if(action)await vscode.env.openExternal(vscode.Uri.parse(action.url));
}
module.exports={check,present,describe,compare,version,releaseUrl,UpdateError};

