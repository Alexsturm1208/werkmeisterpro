﻿function getFriendlyLoginError(err){
var msg=String((err&&err.message)||'').trim();
var code=String((err&&err.code)||'').trim().toLowerCase();
var low=msg.toLowerCase();
if(code==='email_not_confirmed'||low.indexOf('email not confirmed')!==-1)return'E-Mail noch nicht bestätigt. Bitte den Link in der Bestätigungs-Mail öffnen.';
if(low.indexOf('row-level security policy')!==-1)return'Login technisch blockiert.';
if(low.indexOf('invalid login credentials')!==-1)return'Ungültige Anmeldedaten. Bitte E-Mail/Passwort prüfen oder "Passwort vergessen?" nutzen.';
if(low.indexOf('invalid_credentials')!==-1)return'Ungültige Anmeldedaten. Bitte E-Mail/Passwort prüfen.';
if(low.indexOf('too many')!==-1||low.indexOf('rate limit')!==-1)return'Zu viele Versuche. Bitte kurz warten und erneut anmelden.';
return msg||'Anmeldung fehlgeschlagen';
}
function showMustChangePasswordModal(){var m=document.getElementById('mustChangePwModal');if(m){m.style.display='flex';m.classList.add('active')}var form=document.getElementById('mustChangePwForm');if(form)form.reset();var err=document.getElementById('mustChangePwError');if(err)err.classList.add('hidden')}
function hideMustChangePasswordModal(){var m=document.getElementById('mustChangePwModal');if(m){m.style.display='none';m.classList.remove('active')}}
async function saveMustChangePassword(e){
  if(e)e.preventDefault();
  var np=document.getElementById('mustChangePwNew').value;
  var nc=document.getElementById('mustChangePwConfirm').value;
  var err=document.getElementById('mustChangePwError');
  if(err)err.classList.add('hidden');
  if(!np||np.length<6){if(err){err.textContent='Passwort muss mindestens 6 Zeichen haben.';err.classList.remove('hidden')}return}
  if(np!==nc){if(err){err.textContent='Passwörter stimmen nicht überein.';err.classList.remove('hidden')}return}
  if(!currentUser){hideMustChangePasswordModal();return}
  var u=users.find(function(x){return String(x.id||'')===String(currentUser.id||'')});
  if(u){u.passwordHash=hashPassword(np);u.mustChangePassword=false}
  await saveData();
  hideMustChangePasswordModal();
  alert('Passwort erfolgreich geändert.');
}
async function changeOwnPassword(e){
  if(e)e.preventDefault();
  var np=(document.getElementById('newOwnPassword').value||'').trim();
  var nc=(document.getElementById('confirmOwnPassword').value||'').trim();
  if(!np||np.length<6){alert('Passwort muss mindestens 6 Zeichen haben.');return}
  if(np!==nc){alert('Passwörter stimmen nicht überein.');return}
  if(!currentUser){alert('Nicht angemeldet.');return}
  var u=users.find(function(x){return String(x.id||'')===String(currentUser.id||'')});
  if(u){u.passwordHash=hashPassword(np);u.mustChangePassword=false}
  await saveData();
  alert('Passwort erfolgreich geändert.');
  var form=document.getElementById('newOwnPassword');if(form)form.value='';
  var form2=document.getElementById('confirmOwnPassword');if(form2)form2.value='';
}
// ── Benutzerverwaltung ────────────────────────────────────────────────────
function renderUsers(){
  var el=document.getElementById('usersList');if(!el)return;
  var role=currentUser?currentUser.role:'';
  if(role!=='admin'&&role!=='master'){el.innerHTML='<p class="text-gray-500 text-center py-8">Keine Berechtigung.</p>';return}
  users=ensureArray(users);
  if(!users.length){el.innerHTML='<p class="text-gray-500 text-center py-8">Keine Benutzer</p>';return}
  el.innerHTML=users.map(function(u){
    var isAdmin=u.role==='admin'||u.role==='master';
    var isMe=currentUser&&String(u.id||'')===String(currentUser.id||'');
    var active=u.active!==false;
    var initials=getUserInitials(u);
    var avatarBg=getUserAvatarColor(u.role);
    var roleLabel=getRoleLabel(u.role);
    var lastLogin=u.lastLogin?new Date(u.lastLogin).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'Noch nie';
    var canDeact=!(isAdmin&&u.role==='admin'&&users.filter(function(x){return x.role==='admin'&&x.active!==false}).length<=1);
    return '<div class="user-card mb-3">'
      +'<div class="user-card-avatar" style="background:'+avatarBg+'">'+esc(initials)+'</div>'
      +'<div style="flex:1;min-width:0">'
      +'<div class="flex flex-wrap items-center gap-2 mb-1">'
      +'<span class="font-bold text-gray-800">'+esc(u.displayName||u.username||'Benutzer')+'</span>'
      +(isMe?'<span class="text-xs text-cyan-600">(Sie)</span>':''  )
      +'<span class="badge-role-'+esc(u.role==='admin'||u.role==='master'?'admin':(u.role||'mitarbeiter'))+'">'+esc(roleLabel)+'</span>'
      +(u.isSystem?'<span style="font-size:.72rem;background:#fef3c7;color:#92400e;border:1px solid #fcd34d;border-radius:6px;padding:1px 7px;font-weight:600;">System</span>':'')
      +(active?'<span class="user-status-active">● Aktiv</span>':'<span class="user-status-inactive">● Deaktiviert</span>')
      +'</div>'
      +'<div class="text-xs text-gray-500">@'+esc(u.username||'-')+' · Letzter Login: '+lastLogin+'</div>'
      +'</div>'
      +'<div class="flex flex-wrap gap-2 ml-auto">'
      +(u.isSystem
        ?'<span style="font-size:.8rem;color:#92400e;padding:4px 10px;align-self:center;">admin / admin · nicht änderbar</span>'
        :'<button onclick="showUserModal(\''+esc(u.id)+'\')" class="btn btn-secondary btn-sm">Bearbeiten</button>'
          +'<button onclick="wmResetUserPassword(\''+esc(u.id)+'\')" class="btn btn-secondary btn-sm">PW zurücksetzen</button>'
          +((!isMe&&canDeact)?('<button onclick="wmToggleUserActive(\''+esc(u.id)+'\')" class="btn btn-secondary btn-sm '+(active?'btn-danger':'')+'">'+( active?'Deaktivieren':'Aktivieren')+'</button>'):'')
      )
      +'</div>'
      +'</div>';
  }).join('');
}
async function wmResetUserPassword(uid){
  if(currentUser&&(currentUser.role!=='admin'&&currentUser.role!=='master')){alert('Keine Berechtigung.');return}
  var u=users.find(function(x){return String(x.id||'')===uid});
  if(!u)return;
  if(u.isSystem){alert('Das Systemkonto kann nicht geändert werden.');return}
  var np=await uiPrompt('Temporäres Passwort für "'+esc(u.displayName||u.username||uid)+'" setzen:','','Passwort zurücksetzen','Mindestens 6 Zeichen');
  if(!np)return;
  if(String(np).length<6){alert('Passwort muss mindestens 6 Zeichen haben.');return}
  u.passwordHash=hashPassword(np);
  u.mustChangePassword=true;
  await saveData();
  renderUsers();
  alert('Passwort wurde zurückgesetzt. Benutzer muss es beim nächsten Login ändern.');
}
async function wmToggleUserActive(uid){
  var u=users.find(function(x){return String(x.id||'')===uid});
  if(!u)return;
  if(u.isSystem){alert('Das Systemkonto kann nicht deaktiviert werden.');return}
  if(u.role==='admin'&&u.active!==false&&users.filter(function(x){return x.role==='admin'&&x.active!==false}).length<=1){alert('Mindestens ein Admin muss aktiv bleiben.');return}
  var next=u.active===false;
  if(!await uiConfirm((next?'Benutzer aktivieren':'Benutzer deaktivieren')+': "'+esc(u.displayName||u.username||uid)+'"?','Benutzer '+(next?'aktivieren':'deaktivieren')))return;
  u.active=next;
  addAuditEntry(next?'Benutzer aktiviert':'Benutzer deaktiviert','Benutzer',uid,'Name: '+(u.displayName||u.username||'-'));
  await saveData();renderUsers();
}
function showUserModal(uid){
  uid=uid||'';
  if(currentUser&&currentUser.role!=='admin'&&currentUser.role!=='master'){alert('Keine Berechtigung.');return}
  var form=document.getElementById('userForm');if(form)form.reset();
  document.getElementById('editUserId').value='';
  document.getElementById('userModalTitle').textContent='Neuer Benutzer';
  document.getElementById('userPasswordLabel').textContent='Passwort * (min. 6 Zeichen)';
  document.getElementById('userPassword').required=true;
  document.getElementById('userPasswordConfirm').required=true;
  document.getElementById('userPwConfirmWrap').style.display='';
  document.getElementById('userActive').checked=true;
  document.getElementById('userPwChangeHint').classList.add('hidden');
  var errEl=document.getElementById('userModalError');if(errEl)errEl.classList.add('hidden');
  if(uid){
    var u=users.find(function(x){return String(x.id||'')===String(uid)});
    if(!u)return;
    if(u.isSystem){alert('Das Systemkonto kann nicht bearbeitet werden.');return}
    document.getElementById('userModalTitle').textContent='Benutzer bearbeiten';
    document.getElementById('editUserId').value=u.id;
    document.getElementById('userFirstName').value=u.firstName||'';
    document.getElementById('userLastName').value=u.lastName||'';
    document.getElementById('userUsername').value=u.username||'';
    document.getElementById('userRole').value=u.role||'mitarbeiter';
    document.getElementById('userActive').checked=u.active!==false;
    document.getElementById('userPassword').required=false;
    document.getElementById('userPasswordConfirm').required=false;
    document.getElementById('userPasswordLabel').textContent='Passwort (optional – leer lassen = unverändert)';
    if(u.mustChangePassword)document.getElementById('userPwChangeHint').classList.remove('hidden');
  }
  applyRoleDefaults();
  document.getElementById('userModal').classList.add('active');
}
function hideUserModal(){var m=document.getElementById('userModal');if(m)m.classList.remove('active')}
async function saveUser(e){
  if(e)e.preventDefault();
  if(currentUser&&currentUser.role!=='admin'&&currentUser.role!=='master'){alert('Keine Berechtigung.');return}
  var id=(document.getElementById('editUserId').value||'').trim();
  var firstName=(document.getElementById('userFirstName').value||'').trim();
  var lastName=(document.getElementById('userLastName').value||'').trim();
  var username=(document.getElementById('userUsername').value||'').trim().toLowerCase();
  var role=(document.getElementById('userRole').value||'mitarbeiter').trim();
  var pw=(document.getElementById('userPassword').value||'').trim();
  var pwc=(document.getElementById('userPasswordConfirm').value||'').trim();
  var active=!!document.getElementById('userActive').checked;
  var errEl=document.getElementById('userModalError');
  if(errEl)errEl.classList.add('hidden');
  function showErr(msg){if(errEl){errEl.textContent=msg;errEl.classList.remove('hidden')}}
  if(!firstName||!lastName||!username){showErr('Bitte alle Pflichtfelder ausfüllen.');return}
  if(!/^[a-z0-9._-]+$/.test(username)){showErr('Benutzername: nur Kleinbuchstaben, Ziffern, Punkte, Bindestriche.');return}
  if(!id&&(!pw||pw.length<6)){showErr('Passwort muss mindestens 6 Zeichen haben.');return}
  if(pw&&pw.length>0){if(pw.length<6){showErr('Passwort muss mindestens 6 Zeichen haben.');return}if(pw!==pwc){showErr('Passwörter stimmen nicht überein.');return}}
  var dup=users.find(function(u){return String(u.username||'').toLowerCase()===username&&String(u.id||'')!==id});
  if(dup){showErr('Benutzername bereits vergeben.');return}
  var oldUser=id?users.find(function(u){return String(u.id||'')===id}):null;
  if(oldUser&&oldUser.isSystem){showErr('Das Systemkonto kann nicht bearbeitet werden.');return}
  var entry={id:id||('usr_'+Date.now()+'_'+Math.random().toString(16).slice(2)),username:username,firstName:firstName,lastName:lastName,displayName:firstName+' '+lastName,role:role,active:active,permissions:getPermissionsByRole(role),mustChangePassword:oldUser?!!oldUser.mustChangePassword:false,lastLogin:oldUser?oldUser.lastLogin:null,createdAt:oldUser?oldUser.createdAt:Date.now()};
  entry.passwordHash=pw?hashPassword(pw):(oldUser?oldUser.passwordHash:null);
  if(id){users=users.filter(function(u){return String(u.id||'')!==id})}
  users.unshift(entry);
  if(currentUser&&String(entry.id)===String(currentUser.id)){currentUser.displayName=entry.displayName;currentUser.firstName=entry.firstName;currentUser.lastName=entry.lastName;currentUser.role=entry.role;currentUser.permissions=entry.permissions;var nameEl=document.getElementById('sidebarUserName');if(nameEl)nameEl.textContent=currentUser.displayName;applyPermissions()}
  addAuditEntry(id?'Benutzer bearbeitet':'Benutzer erstellt','Benutzer',entry.id,'Name: '+entry.displayName+', Rolle: '+entry.role);
  await saveData();renderUsers();hideUserModal();
}
async function deleteUser(id){
  if(currentUser&&currentUser.role!=='admin'&&currentUser.role!=='master'){alert('Keine Berechtigung.');return}
  id=String(id||'');var u=users.find(function(x){return String(x.id||'')===id});
  if(!u)return;
  if(u.isSystem){alert('Das Systemkonto kann nicht gelöscht werden.');return}
  if(currentUser&&id===String(currentUser.id||'')){alert('Eigener Benutzer kann nicht gelöscht werden.');return}
  if(u.role==='admin'&&users.filter(function(x){return x.role==='admin'}).length<=1){alert('Letzter Admin kann nicht gelöscht werden.');return}
  if(!await uiConfirm('Benutzer "'+esc(u.displayName||u.username||id)+'" löschen?','Benutzer löschen'))return;
  users=users.filter(function(x){return String(x.id||'')!==id});
  addAuditEntry('Benutzer gelöscht','Benutzer',id,'Name: '+(u.displayName||u.username||'-'));
  await saveData();renderUsers();
}
function loadUsers(){users=ensureArray(users).filter(function(u){return u&&u.id});if(!currentUser)return;var sid=String(currentUser.id||currentUserId||'');if(!sid)return;var idx=users.findIndex(function(u){return String(u.id||'')===sid});var sessionUser={id:sid,username:currentUser.email||currentUserId||'',displayName:currentUser.displayName||'Benutzer',role:currentUser.role||'user',permissions:Object.assign({},currentUser.permissions||{})};if(idx===-1)users.unshift(sessionUser);else users[idx]=Object.assign({},users[idx],sessionUser,{password:''})}
async function saveUsers(){await saveData();renderUsers()}
function getDefaultPermissionsByRole(role){if(role==='admin'||role==='master')return{dashboard:true,customers:true,articles:true,orders:true,offers:true,invoices:true,dunning:true,appointments:true,tax:true,settings:true};return{dashboard:true,customers:true,articles:true,orders:true,offers:true,invoices:true,dunning:true,appointments:true,tax:true,settings:false}}
function readUserPermissionsFromForm(){return{dashboard:!!document.getElementById('perm_dashboard').checked,customers:!!document.getElementById('perm_customers').checked,articles:true,orders:!!document.getElementById('perm_orders').checked,offers:!!document.getElementById('perm_offers').checked,invoices:!!document.getElementById('perm_invoices').checked,dunning:!!document.getElementById('perm_dunning').checked,appointments:!!document.getElementById('perm_appointments').checked,tax:!!document.getElementById('perm_tax').checked,settings:!!document.getElementById('perm_settings').checked}}
function writeUserPermissionsToForm(p){p=p||{};document.getElementById('perm_dashboard').checked=!!p.dashboard;document.getElementById('perm_customers').checked=!!p.customers;document.getElementById('perm_orders').checked=!!p.orders;document.getElementById('perm_offers').checked=!!p.offers;document.getElementById('perm_invoices').checked=!!p.invoices;document.getElementById('perm_dunning').checked=!!p.dunning;document.getElementById('perm_appointments').checked=!!p.appointments;document.getElementById('perm_tax').checked=!!p.tax;document.getElementById('perm_settings').checked=!!p.settings}
function registerCompany(){showRegisterCompanyModal()}
async function forgotPassword(){alert('Passwort-Reset ist in der lokalen Version nicht verfügbar. Bitte den Administrator kontaktieren.');}
function showRegisterCompanyModal(){var f=document.getElementById('registerCompanyForm');if(f)f.reset();var em=document.getElementById('loginUsername').value||'';if(em)document.getElementById('regEmail').value=em;document.getElementById('registerCompanyModal').classList.add('active')}
function hideRegisterCompanyModal(){document.getElementById('registerCompanyModal').classList.remove('active')}
function getSignupEmailRedirectUrl(){
try{
var origin=String(window.location.origin||'').trim();
var host=String(window.location.hostname||'').toLowerCase();
var isLocal=(host==='localhost'||host==='127.0.0.1'||host==='[::1]'||host.endsWith('.local'));
if(origin&&!isLocal)return origin.replace(/\/+$/,'/') ;
return APP_PUBLIC_URL
}catch(e){return APP_PUBLIC_URL}
}
async function submitRegisterCompany(e){
e.preventDefault();
alert('Online-Registrierung ist in der lokalen Version nicht verfügbar.');
hideRegisterCompanyModal();
}
function editUser(id){showUserModal(id)}
function toggleRoleLock(){var role=(document.getElementById('userRole').value||'user').trim().toLowerCase();var lock=role==='admin';if(lock)writeUserPermissionsToForm(getDefaultPermissionsByRole('admin'));['perm_dashboard','perm_customers','perm_orders','perm_offers','perm_invoices','perm_dunning','perm_appointments','perm_tax','perm_settings'].forEach(function(id){var el=document.getElementById(id);if(el){el.disabled=lock;var card=el.closest('.p-3');if(card)card.style.opacity=lock?'0.7':'1'}})}

function renderAuditLog(){var el=document.getElementById('auditLogList');if(!el)return;var list=(auditLog||[]).slice(0,50);if(!list.length){el.innerHTML='<p class="text-gray-500 text-center py-8">Keine Einträge</p>';return}el.innerHTML='<div class="space-y-2">'+list.map(function(x){return'<div class="p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm"><div class="font-semibold text-gray-800">'+esc(x.action||'-')+'</div><div class="text-gray-500">'+new Date(x.createdAt||Date.now()).toLocaleString('de-DE')+' · '+esc(x.user||'-')+'</div>'+(x.details?'<div class="text-gray-600 mt-1">'+esc(x.details)+'</div>':'')+'</div>'}).join('')+'</div>'}
function updateGobdStats(){var e1=document.getElementById('gobdCountLogs');if(e1)e1.textContent=String((auditLog||[]).length)}