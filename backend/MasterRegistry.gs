/**
 * MasterRegistry.gs
 * 
 * หน้าที่: เป็นสมุดหน้าเหลือง (DNS) รับ License Key แล้วคืนค่า API URL ของลูกค้ารายนั้น
 * การติดตั้ง: 
 * 1. สร้าง Google Sheet ใหม่ชื่อ "Master Registry"
 * 2. สร้าง Sheet ชื่อ "Registry"
 * 3. ใส่ Header: LicenseKey | ClientName | ApiUrl | IsActive
 * 4. นำโค้ดนี้ไปใส่ใน Extensions > Apps Script แล้ว Deploy เป็น Web App
 */

function doPost(e) {
  // รองรับ CORS preflight
  if (typeof e === 'undefined') {
    return responseJSON({ status: 'error', message: 'No data received' });
  }

  try {
    // รับข้อมูลแบบ text/plain เพื่อเลี่ยง CORS แล้วมา Parse เป็น JSON
    var request = JSON.parse(e.postData.contents);
    var action = request.action;
    
    if (action === 'verify_license') {
      var licenseKey = request.licenseKey;
      return verifyLicense(licenseKey);
    }
    
    return responseJSON({ status: 'error', message: 'Invalid action' });
    
  } catch (error) {
    return responseJSON({ status: 'error', message: error.toString() });
  }
}

// ฟังก์ชันตรวจสอบ License
function verifyLicense(licenseKey) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Registry');
  
  if (!sheet) {
    return responseJSON({ status: 'error', message: 'Registry sheet not found' });
  }
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  // หา Index ของแต่ละคอลัมน์
  var keyIdx = headers.indexOf('LicenseKey');
  var nameIdx = headers.indexOf('ClientName');
  var urlIdx = headers.indexOf('ApiUrl');
  var activeIdx = headers.indexOf('IsActive');
  
  // วนลูปหา License Key
  for (var i = 1; i < data.length; i++) {
    if (data[i][keyIdx] === licenseKey) {
      if (data[i][activeIdx] === true || data[i][activeIdx] === 'TRUE') {
        return responseJSON({
          status: 'success',
          data: {
            clientName: data[i][nameIdx],
            apiUrl: data[i][urlIdx]
          }
        });
      } else {
        return responseJSON({ status: 'error', message: 'License is inactive' });
      }
    }
  }
  
  return responseJSON({ status: 'error', message: 'Invalid License Key' });
}

// Helper ส่ง JSON กลับไปที่ React
function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// รองรับ GET Request เผื่อใช้เทสผ่าน Browser
function doGet(e) {
  return responseJSON({ status: 'success', message: 'Master Registry API is running' });
}
