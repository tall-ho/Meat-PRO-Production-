import { MASTER_REGISTRY_URL } from '../constants';

export const fetchMasterRegistry = async (licenseKey: string) => {
  try {
    const response = await fetch(`${MASTER_REGISTRY_URL}?action=getDbUrl&licenseKey=${licenseKey}`);
    if (!response.ok) {
      throw new Error('Failed to fetch master registry');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching master registry:', error);
    throw error;
  }
};

export const fetchClientData = async (apiUrl: string, sheetName: string) => {
  try {
    const response = await fetch(`${apiUrl}?action=read&sheet=${sheetName}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch data from ${sheetName}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching data from ${sheetName}:`, error);
    throw error;
  }
};
