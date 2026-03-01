import { STORAGE_KEYS, MASTER_REGISTRY_URL } from '../constants';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status?: string;
}

export interface SystemInfo {
    status: string;
    systemName: string;
    spreadsheetName: string;
}

// ฟังก์ชันสำหรับดึง URL ที่บันทึกไว้
const getApiUrl = () => localStorage.getItem(STORAGE_KEYS.API_URL);

/**
 * Lookup Client URL via License Key from Master Registry
 */
export const lookupClientByLicense = async (licenseKey: string): Promise<{ success: boolean; url?: string; name?: string; message?: string }> => {
  if (!MASTER_REGISTRY_URL || MASTER_REGISTRY_URL.includes('PASTE_YOUR')) {
    return { success: false, message: 'System configuration error: Master Registry not set.' };
  }

  try {
    const response = await fetch(`${MASTER_REGISTRY_URL}?action=lookup&key=${licenseKey}`);
    const json = await response.json();

    // Check specifically for configuration errors (Wrong Script Deployed)
    if (json.status === 'error') {
        if (json.message === 'Invalid action') {
            return { 
                success: false, 
                message: '⚠️ ผิดพลาด: URL ของ Registry กำลังรันโค้ดผิดไฟล์ (คุณน่าจะเผลอวางโค้ด Code.gs ลงไป ให้เปลี่ยนเป็นโค้ดจาก MasterRegistry.gs)' 
            };
        }
        if (json.message && json.message.includes('CRITICAL CONFIG ERROR')) {
             return { 
                success: false, 
                message: `⚠️ ผิดพลาดการติดตั้ง: ${json.message}` 
            };
        }
    }

    if (json.status === 'success') {
      return { success: true, url: json.url, name: json.clientName };
    } else {
      return { success: false, message: json.message || 'License Key ไม่ถูกต้อง' };
    }
  } catch (error) {
    console.error(error);
    return { success: false, message: 'ไม่สามารถเชื่อมต่อ Server ส่วนกลางได้' };
  }
};

/**
 * Test connection to the sheet and get System Info
 */
export const testConnection = async (url: string): Promise<SystemInfo | null> => {
  try {
    const testUrl = `${url}?action=info`;
    const response = await fetch(testUrl);
    const json = await response.json();
    
    if (json.status === 'success') {
        return json as SystemInfo;
    }
    return null;
  } catch (error) {
    console.error("Connection failed:", error);
    return null;
  }
};

/**
 * Fetch all data from a specific sheet tab.
 */
export const fetchSheetData = async <T>(sheetName: string): Promise<T[]> => {
  const apiUrl = getApiUrl();
  if (!apiUrl) return []; 

  try {
    // Use POST with text/plain to avoid CORS preflight and follow redirects
    const response = await fetch(apiUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'read',
        sheet: sheetName
      })
    });

    const text = await response.text();
    if (!text) {
        return [];
    }

    let json;
    try {
        json = JSON.parse(text);
    } catch (e) {
        console.error(`Invalid JSON from ${sheetName}:`, text);
        return [];
    }
    
    if (json.status === 'error') {
      throw new Error(json.message);
    }
    
    return json.data as T[]; // The prompt says response format has 'data' field
  } catch (error) {
    console.error(`Failed to fetch ${sheetName}:`, error);
    return [];
  }
};

/**
 * Save data to a specific sheet tab.
 * @param sheetName Name of the sheet (tab)
 * @param data Array of objects to save
 * @param headers (Optional) Explicit column headers. Use this to ensure correct column order or create headers for empty sheets.
 */
export const saveSheetData = async <T>(sheetName: string, data: T[], headers?: string[]): Promise<boolean> => {
  const apiUrl = getApiUrl();
  if (!apiUrl) return false;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'write',
        sheet: sheetName,
        data: data,
        headers: headers // Send explicit headers
      })
    });

    const text = await response.text();
    if (!text) {
        // If response is empty, treat as success (some scripts might not return body)
        return true;
    }

    let json;
    try {
        json = JSON.parse(text);
    } catch (e) {
        console.error(`Invalid JSON response from saveSheetData for ${sheetName}:`, text);
        // If it's not JSON but we got a 200 OK and some text, it might be an HTML error page or simple success message
        return false;
    }

    if (json.status === 'error') throw new Error(json.message);
    return true;
  } catch (error) {
    console.error(`Failed to save ${sheetName}:`, error);
    return false;
  }
};
