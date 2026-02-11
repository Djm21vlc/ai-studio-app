
// VERSION 5.1 - NEWS & LEADERBOARD SUPPORT
// --------------------------------------------------------------------------------------------
// INSTRUCCIONES:
// 1. Pega este código en "Código.gs"
// 2. "Implementar" > "Nueva implementación" > "Aplicación web" > Acceso: "Cualquiera"
// --------------------------------------------------------------------------------------------

function setup() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Asegurar Hoja Usuarios
    var userSheet = getSheetFlexible(ss, ['ususarios', 'usuarios', 'users', 'socios']);
    if (!userSheet) {
       userSheet = ss.insertSheet('usuarios'); 
       userSheet.appendRow(['id_usuario', 'nombre', 'email', 'autorizado', 'rol', 'pass', 'fecha_reg', 'fecha_ult']);
       userSheet.appendRow(['admin-init', 'admin', 'admin@cromoche.com', 'TRUE', 'admin', 'admin123', getTimestamp(), getTimestamp()]);
    }

    // 2. Asegurar Hoja Coleccion
    var colSheet = getSheetFlexible(ss, ['coleccion_usuarios', 'collection']);
    if (!colSheet) {
       colSheet = ss.insertSheet('coleccion_usuarios');
       colSheet.appendRow(['id_usuario', 'id_cromo', 'cantidad', 'fecha']);
    }

    // 3. Asegurar Hoja Mensajes
    var msgSheet = getSheetFlexible(ss, ['mensajes', 'messages']);
    if (!msgSheet) {
       msgSheet = ss.insertSheet('mensajes');
       msgSheet.appendRow(['id', 'sender_id', 'receiver_id', 'title', 'body', 'created_at', 'read']);
    }

    // 4. Asegurar Hoja Config
    var configSheet = getSheetFlexible(ss, ['config', 'configuracion']);
    if (!configSheet) {
       configSheet = ss.insertSheet('config');
       configSheet.appendRow(['key', 'value', 'updated_at']);
       configSheet.appendRow(['active_api_url', '', getTimestamp()]);
       configSheet.appendRow(['login_message', '¡Bienvenidos a la nueva temporada!', getTimestamp()]);
    }
    
    // 5. Asegurar Carpetas
    var folders = DriveApp.getFoldersByName("Cromoche_Images");
    if (!folders.hasNext()) DriveApp.createFolder("Cromoche_Images");

    console.log("✅ SETUP COMPLETADO v5.1");
  } catch (e) {
    console.error("❌ ERROR EN SETUP: " + e.toString());
  }
}

function doGet(e) {
  if (!e || !e.parameter || Object.keys(e.parameter).length === 0) {
      return ContentService.createTextOutput("✅ BACKEND OPERATIVO v5.1").setMimeType(ContentService.MimeType.TEXT);
  }

  if (e.parameter.action === 'ping') {
     return ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'Conectado.' })).setMimeType(ContentService.MimeType.JSON);
  }
  return handleResponse();
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000); 

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getSheetFlexible(ss, ['ususarios', 'usuarios', 'users']);
    if (!sheet) { 
        sheet = ss.insertSheet('usuarios'); 
        sheet.appendRow(['id_usuario', 'nombre', 'email', 'autorizado', 'rol', 'pass', 'fecha_reg', 'fecha_ult']); 
    }

    var data;
    try { data = JSON.parse(e.postData.contents); } catch(p) { return createJSONOutput({ status: 'error', message: 'JSON inválido' }); }
    
    var action = data.action;

    if (action === 'register') {
      var username = String(data.username).trim();
      var email = String(data.email).toLowerCase().trim();
      
      var headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
      var nameIdx = findHeaderIndex(headers, ['nombre', 'usuario', 'username']);
      var emailIdx = findHeaderIndex(headers, ['email', 'correo', 'mail']);
      
      var dataU = sheet.getDataRange().getValues();
      for (var i=1; i<dataU.length; i++) {
         if (nameIdx > -1 && dataU[i][nameIdx] && String(dataU[i][nameIdx]).toLowerCase().trim() === username.toLowerCase()) {
             return createJSONOutput({ status: 'error', message: 'El nombre de usuario ya existe.' });
         }
         if (emailIdx > -1 && dataU[i][emailIdx] && String(dataU[i][emailIdx]).toLowerCase().trim() === email) {
             return createJSONOutput({ status: 'error', message: 'Este email ya está registrado.' });
         }
      }
      
      var newRow = prepareRow(headers, {
          'id_usuario': Utilities.getUuid(),
          'nombre': data.username,
          'email': email,
          'autorizado': 'FALSE',
          'rol': 'user',
          'pass': '',
          'fecha_reg': getTimestamp(),
          'fecha_ult': ''
      });
      
      sheet.appendRow(newRow);
      return createJSONOutput({ status: 'success', message: 'Registrado' });
    }

    if (action === 'update_collection') {
      updateCellFlexible(sheet, data.userId, ['fecha_ult'], getTimestamp());
      updateCollection(ss, data.userId, data.items);
      return createJSONOutput({ status: 'success' });
    }

    if (action === 'trade_create') {
        var tradeSheet = getSheetFlexible(ss, ['cambios', 'trades']);
        tradeSheet.appendRow([Utilities.getUuid().slice(0,8), data.senderId, data.receiverId, data.offeredStickerId, data.requestedStickerId, 'PENDIENTE', getTimestamp(), getTimestamp(), '', '', data.senderComment, '']);
        return createJSONOutput({ status: 'success' });
    }

    // --- CONFIG ACTIONS ---
    if (action === 'update_login_news') {
        var cSheet = getSheetFlexible(ss, ['config']);
        if (!cSheet) { cSheet = ss.insertSheet('config'); cSheet.appendRow(['key', 'value', 'updated_at']); }
        
        var cData = cSheet.getDataRange().getValues();
        var keyFound = false;
        
        for(var i=1; i<cData.length; i++) {
            if(String(cData[i][0]) === 'login_message') {
                cSheet.getRange(i+1, 2).setValue(data.message);
                cSheet.getRange(i+1, 3).setValue(getTimestamp());
                keyFound = true;
                break;
            }
        }
        if(!keyFound) {
            cSheet.appendRow(['login_message', data.message, getTimestamp()]);
        }
        return createJSONOutput({ status: 'success' });
    }

    // --- MESSAGING ACTIONS ---

    if (action === 'send_message') {
        var msgSheet = getSheetFlexible(ss, ['mensajes', 'messages']);
        if (!msgSheet) { msgSheet = ss.insertSheet('mensajes'); msgSheet.appendRow(['id', 'sender_id', 'receiver_id', 'title', 'body', 'created_at', 'read']); }
        
        var recipients = data.recipients || []; 
        var timestamp = getTimestamp();
        
        recipients.forEach(function(rxId) {
            msgSheet.appendRow([Utilities.getUuid(), data.senderId, rxId, data.title, data.body, timestamp, 'FALSE']);
        });
        
        return createJSONOutput({ status: 'success' });
    }

    if (action === 'mark_message_read') {
        var msgSheet = getSheetFlexible(ss, ['mensajes', 'messages']);
        var mData = msgSheet.getDataRange().getValues();
        var idCol = findHeaderIndex(mData[0], ['id']);
        var readCol = findHeaderIndex(mData[0], ['read', 'leido']);
        
        if (idCol > -1 && readCol > -1) {
            for(var i=1; i<mData.length; i++) {
                if (String(mData[i][idCol]) === String(data.messageId)) {
                    msgSheet.getRange(i+1, readCol+1).setValue('TRUE');
                    break;
                }
            }
        }
        return createJSONOutput({ status: 'success' });
    }
    
    // --- ADMIN ACTIONS ---

    if (action === 'admin_set_config') {
         // Generic config setter if needed
         var cSheet = getSheetFlexible(ss, ['config']);
         // Implementation skipped for brevity, focused on update_login_news
    }

    if (action === 'admin_create_user') {
       var headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
       var newRow = prepareRow(headers, {
          'id_usuario': Utilities.getUuid(),
          'nombre': data.username,
          'email': data.email,
          'autorizado': 'TRUE',
          'rol': data.role || 'user',
          'pass': data.password,
          'fecha_reg': getTimestamp(),
          'fecha_ult': ''
       });
       sheet.appendRow(newRow);
       return createJSONOutput({ status: 'success', userId: newRow[0] }); 
    }

    if (action === 'admin_update_user') {
       var targetId = data.targetUserId;
       updateCellFlexible(sheet, targetId, ['autorizado'], data.isAuthorized ? 'TRUE' : 'FALSE');
       if(data.role) updateCellFlexible(sheet, targetId, ['rol'], data.role);
       return createJSONOutput({ status: 'success' });
    }

    if (action === 'admin_delete_user') {
       var rows = sheet.getDataRange().getValues();
       var idIdx = findHeaderIndex(rows[0], ['id_usuario', 'id']);
       for(var i=rows.length-1; i>=1; i--){
           if(String(rows[i][idIdx]) === String(data.targetUserId)) {
               sheet.deleteRow(i+1);
               var cSheet = getSheetFlexible(ss, ['coleccion_usuarios']);
               if(cSheet) {
                   var cRows = cSheet.getDataRange().getValues();
                   var uIdIdx = findHeaderIndex(cRows[0], ['id_usuario']);
                   for(var k=cRows.length-1; k>=1; k--) {
                       if(String(cRows[k][uIdIdx]) === String(data.targetUserId)) cSheet.deleteRow(k+1);
                   }
               }
               break;
           }
       }
       return createJSONOutput({ status: 'success' });
    }

    if (action === 'change_password') {
        updateCellFlexible(sheet, data.userId, ['pass', 'password'], data.password);
        return createJSONOutput({ status: 'success' });
    }
    
    if (action === 'update_sticker_image') {
        var sSheet = getSheetFlexible(ss, ['cromos']);
        updateCellFlexible(sSheet, data.stickerId, ['imagenurl', 'url', 'img'], data.imageUrl);
        return createJSONOutput({ status: 'success' });
    }
    
    if (action === 'trade_update') {
        var tSheet = getSheetFlexible(ss, ['cambios', 'trades']);
        var tData = tSheet.getDataRange().getValues();
        var idCol = findHeaderIndex(tData[0], ['id']);
        var stCol = findHeaderIndex(tData[0], ['status', 'estado']);
        var upCol = findHeaderIndex(tData[0], ['updated', 'fecha_final']);
        var sfCol = findHeaderIndex(tData[0], ['s_final', 'senderfinalstatus']);
        var rfCol = findHeaderIndex(tData[0], ['r_final', 'receiverfinalstatus']);
        var sidCol = findHeaderIndex(tData[0], ['sender', 'senderid']);
        
        for (var i=1; i<tData.length; i++) {
            if (String(tData[i][idCol]) === String(data.tradeId)) {
                var rowNum = i + 1;
                if (data.status) tSheet.getRange(rowNum, stCol+1).setValue(data.status);
                tSheet.getRange(rowNum, upCol+1).setValue(getTimestamp());
                if (data.subAction === 'finalize' && data.finalStatus) {
                    var senderId = String(tData[i][sidCol]);
                    if (senderId === String(data.userId)) {
                        tSheet.getRange(rowNum, sfCol+1).setValue(data.finalStatus);
                    } else {
                        tSheet.getRange(rowNum, rfCol+1).setValue(data.finalStatus);
                    }
                }
                break;
            }
        }
        return createJSONOutput({ status: 'success' });
    }
    
    if (action === 'get_folder_files') {
        var folderId = data.folderId;
        var filesMap = {};
        try {
            var f = DriveApp.getFolderById(folderId);
            var files = f.getFiles();
            while(files.hasNext()) {
                var file = files.next();
                filesMap[file.getName().toLowerCase()] = file.getUrl();
            }
            return createJSONOutput({ status: 'success', files: filesMap });
        } catch(e) {
            return createJSONOutput({ status: 'error' });
        }
    }

    if (action === 'upload_image') {
        try {
            var f = DriveApp.getFoldersByName("Cromoche_Images").next();
            var decoded = Utilities.base64Decode(data.base64);
            var blob = Utilities.newBlob(decoded, data.mimeType, data.filename);
            var file = f.createFile(blob);
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            return createJSONOutput({ status: 'success', fileId: file.getId() });
        } catch(e) {
            return createJSONOutput({ status: 'error', message: e.toString() });
        }
    }

    return handleResponse();
  } catch (err) {
    return createJSONOutput({ status: 'error', message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function getTimestamp() {
  return Utilities.formatDate(new Date(), "GMT+1", "dd/MM/yyyy, HH:mm");
}

function createJSONOutput(d) { return ContentService.createTextOutput(JSON.stringify(d)).setMimeType(ContentService.MimeType.JSON); }

function getSheetFlexible(ss, names) {
    var sheets = ss.getSheets();
    for (var i = 0; i < sheets.length; i++) {
        var sName = sheets[i].getName().toLowerCase().trim();
        for (var j = 0; j < names.length; j++) {
            if (sName === names[j].toLowerCase().trim()) return sheets[i];
        }
    }
    return null;
}

function findHeaderIndex(headers, keywords) {
    for(var i=0; i<headers.length; i++) {
        var h = normalizeHeader(headers[i]);
        for(var k=0; k<keywords.length; k++) {
            if(h.indexOf(keywords[k]) > -1) return i;
        }
    }
    return -1;
}

function normalizeHeader(header) {
    if (!header) return "";
    return String(header).toLowerCase().trim()
        .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n')
        .replace(/[^a-z0-9]/g, ''); 
}

function prepareRow(headers, dataMap) {
    var row = [];
    headers.forEach(function(h) {
        var norm = normalizeHeader(h);
        var val = "";
        if (norm.match(/^(id|uuid)/)) val = dataMap['id_usuario'] || dataMap['id'];
        else if (norm.match(/^(nombre|user|usuario)/)) val = dataMap['nombre'];
        else if (norm.match(/^(email|correo)/)) val = dataMap['email'];
        else if (norm.match(/^(auto|active)/)) val = dataMap['autorizado'];
        else if (norm.match(/^(rol|role)/)) val = dataMap['rol'];
        else if (norm.match(/^(pass|clave|contra)/)) val = dataMap['pass'];
        else if (norm.match(/^(fecha_reg|created)/)) val = dataMap['fecha_reg'];
        else if (norm.match(/^(fecha_ult|last)/)) val = dataMap['fecha_ult'];
        row.push(val);
    });
    return row;
}

function updateCellFlexible(sheet, id, headerKeywords, val) {
    var data = sheet.getDataRange().getValues();
    if (data.length < 1) return false;
    var headers = data[0];
    var targetCol = findHeaderIndex(headers, headerKeywords);
    var idCol = findHeaderIndex(headers, ['id', 'uuid', 'usuario']); 
    if (targetCol === -1 || idCol === -1) return false;
    for (var i = 1; i < data.length; i++) {
        if (String(data[i][idCol]) === String(id)) {
            sheet.getRange(i + 1, targetCol + 1).setValue(val);
            return true;
        }
    }
    return false;
}

function updateCollection(ss, uId, items) {
    var s = getSheetFlexible(ss, ['coleccion_usuarios']);
    if(!s) return;
    var data = s.getDataRange().getValues();
    if (data.length === 0) return;
    var headers = data[0];
    var uCol = findHeaderIndex(headers, ['id_usuario', 'idusuario', 'userid']);
    var sCol = findHeaderIndex(headers, ['id_cromo', 'idcromo', 'stickerid']);
    var qCol = findHeaderIndex(headers, ['cantidad', 'count', 'qty']);
    var dCol = findHeaderIndex(headers, ['fecha', 'date', 'updated']);
    if (uCol === -1 || sCol === -1 || qCol === -1) return;
    var mapRow = {}; 
    for(var i=1; i<data.length; i++) {
        if(String(data[i][uCol]) === String(uId)) mapRow[String(data[i][sCol])] = i + 1;
    }
    items.forEach(function(it) {
        if(mapRow[it.stickerId]) {
            s.getRange(mapRow[it.stickerId], qCol + 1).setValue(it.count);
        } else {
            var newRow = new Array(headers.length).fill("");
            newRow[uCol] = uId;
            newRow[sCol] = it.stickerId;
            newRow[qCol] = it.count;
            if (dCol > -1) newRow[dCol] = getTimestamp();
            s.appendRow(newRow);
        }
    });
}

function handleResponse() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var res = {};
    res['usuarios'] = readSheetData(getSheetFlexible(ss, ['usuarios']));
    res['cromos'] = readSheetData(getSheetFlexible(ss, ['cromos']));
    res['especiales'] = readSheetData(getSheetFlexible(ss, ['especiales']));
    res['coleccion_usuarios'] = readSheetData(getSheetFlexible(ss, ['coleccion_usuarios']));
    res['equipos'] = readSheetData(getSheetFlexible(ss, ['equipos']));
    res.cambios = readSheetData(getSheetFlexible(ss, ['cambios', 'trades']));
    res.mensajes = readSheetData(getSheetFlexible(ss, ['mensajes', 'messages']));
    res.config = readSheetData(getSheetFlexible(ss, ['config', 'configuracion']));
    return createJSONOutput(res);
}

function readSheetData(sheet) {
    if (!sheet) return [];
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return []; 
    var headers = data[0].map(function(h) { return normalizeHeader(h); });
    var results = [];
    for (var i = 1; i < data.length; i++) {
        var row = data[i];
        if (row.join("").trim() === "") continue;
        var obj = {};
        for (var j = 0; j < headers.length; j++) {
            if (headers[j]) obj[headers[j]] = row[j];
        }
        results.push(obj);
    }
    return results;
}
