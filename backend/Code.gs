/**
 * Code.gs (Client Database)
 * 
 * หน้าที่: เป็น Backend และ Database ประจำตัวของลูกค้าแต่ละราย
 * ฟีเจอร์เด่น: Auto-Provisioning (สร้าง Sheet และ Header ให้อัตโนมัติถ้ายังไม่มี)
 */

function doPost(e) {
  try {
    var request = JSON.parse(e.postData.contents);
    var action = request.action;
    
    // 1. Auto-Provisioning: เช็คและสร้าง Sheet พื้นฐานอัตโนมัติทุกครั้งที่มี Request
    initDatabaseIfNeeded();

    // 2. Routing ตาม Action
    if (action === 'login') {
      return handleLogin(request.data);
    } else if (action === 'read') {
      return handleRead(request.sheet);
    } else if (action === 'write') {
      return handleWrite(request.sheet, request.data);
    }
    
    return responseJSON({ status: 'error', message: 'Invalid action' });
    
  } catch (error) {
    return responseJSON({ status: 'error', message: error.toString() });
  }
}

// ==========================================
// 🛠️ AUTO-PROVISIONING (Self-Healing DB)
// ==========================================
function initDatabaseIfNeeded() {
  // 1. ตรวจสอบ/สร้าง Sheet "Users"
  var usersHeaders = ['id', 'username', 'password', 'name', 'role', 'canCreate', 'canEdit', 'canApprove', 'canVerify'];
  var defaultAdmin = ['U001', 'admin', '1234', 'Administrator', 'Admin', true, true, true, true];
  ensureSheetExists('Users', usersHeaders, [defaultAdmin]);

  // 2. ตรวจสอบ/สร้าง Sheet "Data" (ตัวอย่างตารางเก็บข้อมูล)
  var dataHeaders = ['id', 'createdAt', 'createdBy', 'status', 'detail'];
  ensureSheetExists('Data', dataHeaders, []);
}

function ensureSheetExists(sheetName, headers, defaultRows) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  
  // ถ้ายังไม่มี Sheet นี้ ให้สร้างใหม่
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    
    // ใส่ Header
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f4f6");
    sheet.setFrozenRows(1); // Freeze แถวแรก
    
    // ใส่ข้อมูล Default (ถ้ามี) เช่น รหัส Admin เริ่มต้น
    if (defaultRows && defaultRows.length > 0) {
      sheet.getRange(2, 1, defaultRows.length, defaultRows[0].length).setValues(defaultRows);
    }
  }
  return sheet;
}

// ==========================================
// 🔐 AUTHENTICATION
// ==========================================
function handleLogin(data) {
  var username = data.username;
  var password = data.password;
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  
  // หา Index ของคอลัมน์ต่างๆ แบบไดนามิก
  var userIdx = headers.indexOf('username');
  var passIdx = headers.indexOf('password');
  
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][userIdx] === username && rows[i][passIdx] === password) {
      // สร้าง Object User เพื่อส่งกลับไป React
      var userObj = {
        id: rows[i][headers.indexOf('id')],
        username: rows[i][userIdx],
        name: rows[i][headers.indexOf('name')],
        role: rows[i][headers.indexOf('role')],
        permissions: {
          canCreate: rows[i][headers.indexOf('canCreate')] === true,
          canEdit: rows[i][headers.indexOf('canEdit')] === true,
          canApprove: rows[i][headers.indexOf('canApprove')] === true,
          canVerify: rows[i][headers.indexOf('canVerify')] === true
        }
      };
      return responseJSON({ status: 'success', data: userObj });
    }
  }
  
  return responseJSON({ status: 'error', message: 'Invalid username or password' });
}

// ==========================================
// 📝 CRUD OPERATIONS
// ==========================================
function handleRead(sheetName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return responseJSON({ status: 'error', message: 'Sheet not found' });
  
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var result = [];
  
  // แปลง Array 2D เป็น Array of Objects
  for (var i = 1; i < rows.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = rows[i][j];
    }
    result.push(obj);
  }
  
  return responseJSON({ status: 'success', data: result });
}

function handleWrite(sheetName, dataObj) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return responseJSON({ status: 'error', message: 'Sheet not found' });
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var newRow = [];
  
  // เรียงข้อมูลให้ตรงกับ Header
  for (var i = 0; i < headers.length; i++) {
    var headerName = headers[i];
    newRow.push(dataObj[headerName] !== undefined ? dataObj[headerName] : '');
  }
  
  sheet.appendRow(newRow);
  return responseJSON({ status: 'success', message: 'Data saved successfully' });
}

// ==========================================
// 🛠️ HELPER
// ==========================================
function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return responseJSON({ status: 'success', message: 'Client Database API is running' });
}
