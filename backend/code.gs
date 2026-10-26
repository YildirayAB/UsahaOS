// ============================================================================
// USAHAOS - ENTERPRISE BACKEND (GOOGLE APPS SCRIPT)
// Target Spreadsheet: Dummy (1SlrtZN_7aBKM_QQppS-5mcC0bhwCiP1G189-wj_kLuA)
// AI Model: Groq API (openai/gpt-oss-120b)
// ============================================================================

const DB_ID = '1SlrtZN_7aBKM_QQppS-5mcC0bhwCiP1G189-wj_kLuA';
const TZ = 'Asia/Jakarta';
const SESSION_TTL_HOURS = 16;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b';

// ============================================================================
// 1. DEFINISI SKEMA DATABASE KONSISTEN & IDEMPOTENT
// ============================================================================
const SCHEMA = {
  Products: [
    'Product_ID', 'SKU', 'Name', 'Category', 'Price', 'Cost',
    'Stock', 'Min_Stock', 'Image_URL', 'Description', 'Use_BOM',
    'Color_Theme', 'Is_Active', 'Created_At', 'Updated_At'
  ],
  Categories: [
    'Category_ID', 'Name', 'Description', 'Sort_Order', 'Color_Theme', 'Is_Active'
  ],
  Materials: [
    'Material_ID', 'SKU', 'Name', 'Unit', 'Stock', 'Min_Stock',
    'Cost_Per_Unit', 'Supplier', 'Is_Active', 'Updated_At'
  ],
  BOM: [
    'BOM_ID', 'Product_ID', 'Material_ID', 'Qty', 'Unit', 'Waste_Pct', 'Updated_At'
  ],
  Modifier_Groups: [
    'Group_ID', 'Group_Name', 'Selection_Type', 'Is_Required',
    'Min_Choice', 'Max_Choice', 'Categories', 'Product_IDs', 'Sort_Order', 'Is_Active'
  ],
  Modifiers: [
    'Modifier_ID', 'Group_ID', 'Group_Name', 'Name', 'Price',
    'Is_Required', 'Min_Choice', 'Max_Choice', 'Categories', 'Product_IDs',
    'Material_ID', 'Material_Qty', 'Is_Active'
  ],
  Discounts: [
    'Discount_ID', 'Code', 'Title', 'Type', 'Value',
    'Min_Purchase', 'Max_Discount', 'Start_Date', 'End_Date',
    'Target_Category', 'Target_Product_IDs', 'Member_Only', 'Is_Active'
  ],
  Members: [
    'Member_ID', 'Name', 'Phone', 'Email', 'Points',
    'Tier', 'Total_Spent', 'Visit_Count', 'Notes', 'Is_Active', 'Join_Date', 'Last_Visit'
  ],
  Point_History: [
    'Log_ID', 'Timestamp', 'Member_ID', 'Tx_ID', 'Type',
    'Points', 'Balance_After', 'Notes', 'Actor'
  ],
  Users: [
    'User_ID', 'Username', 'Password_Hash', 'Salt', 'Role',
    'Full_Name', 'Status', 'Phone', 'Must_Change_Password', 'Created_At', 'Last_Login'
  ],
  Sessions: [
    'Token', 'Username', 'Role', 'Full_Name', 'Created_At', 'Expires_At', 'Is_Active'
  ],
  Shifts: [
    'Shift_ID', 'Username', 'Full_Name', 'Shift_Name', 'Day_Of_Week',
    'Start_Time', 'End_Time', 'Is_Active'
  ],
  Shift_Sessions: [
    'Session_ID', 'Username', 'Full_Name', 'Shift_Name', 'Open_Time', 'Close_Time',
    'Opening_Cash', 'Cash_Sales', 'Cash_Refunds', 'Cash_Expenses',
    'Expected_Cash', 'Actual_Cash', 'Difference', 'Status', 'Notes'
  ],
  Cash_Management: [
    'Cash_Log_ID', 'Timestamp', 'Session_ID', 'Username', 'Type',
    'Amount', 'Reference_ID', 'Notes'
  ],
  Transactions: [
    'Tx_ID', 'Idempotency_Key', 'Timestamp', 'Date_WIB', 'Cashier',
    'Order_Type', 'Table_Number', 'Customer_Name', 'Member_ID',
    'Items_JSON', 'Items_Summary', 'Subtotal', 'Discount_ID', 'Discount_Amount',
    'Points_Redeemed', 'Points_Discount', 'Points_Earned',
    'Tax_Rate', 'Tax_Mode', 'Tax_Amount', 'Rounding_Amount', 'Total',
    'Payment_Method', 'Payment_Status', 'Payment_Ref', 'Amount_Paid', 'Change_Amount',
    'Refund_Status', 'Refunded_Amount', 'Refund_Reason', 'Notes', 'Shift_Session_ID', 'COGS_Total'
  ],
  Transaction_Items: [
    'Item_Row_ID', 'Tx_ID', 'Timestamp', 'Date_WIB', 'Product_ID',
    'Product_Name', 'Category', 'Qty', 'Base_Price', 'Modifiers_JSON',
    'Modifier_Total', 'Unit_Price', 'Subtotal', 'Discount_Allocated',
    'Net_Sales', 'Unit_COGS', 'Total_COGS', 'Gross_Profit', 'Refunded_Qty', 'Notes'
  ],
  Payments: [
    'Payment_ID', 'Tx_ID', 'Timestamp', 'Method', 'Amount',
    'Reference', 'Status', 'Verified_By', 'Verified_At'
  ],
  Refunds: [
    'Refund_ID', 'Tx_ID', 'Timestamp', 'Date_WIB', 'Actor',
    'Refund_Type', 'Refund_Amount', 'Payment_Method', 'Reason',
    'Restore_Stock_Mode', 'Items_JSON', 'External_Status', 'Shift_Session_ID'
  ],
  Stock_Movements: [
    'Movement_ID', 'Timestamp', 'Item_Type', 'Item_ID', 'Item_Name',
    'Type', 'Qty', 'Unit', 'Prev_Stock', 'New_Stock', 'Unit_Cost',
    'Reference_ID', 'Notes', 'Actor'
  ],
  Settings: [
    'Key', 'Value', 'Description', 'Updated_At'
  ],
  Activity_Logs: [
    'Log_ID', 'Timestamp', 'Actor', 'Role', 'Action', 'Target', 'Details'
  ],
  Daily_Summary: [
    'Date_WIB', 'Gross_Sales', 'Discount_Total', 'Refund_Total', 'Net_Sales',
    'Tax_Total', 'COGS_Total', 'Gross_Profit', 'Tx_Count', 'Items_Sold',
    'Cash_Total', 'QRIS_Total', 'Transfer_Total', 'Updated_At'
  ],
  Product_Summary: [
    'Product_ID', 'Product_Name', 'Category', 'Qty_Sold', 'Refunded_Qty',
    'Net_Qty', 'Gross_Revenue', 'Total_COGS', 'Gross_Profit', 'Updated_At'
  ],
  Payment_Summary: [
    'Payment_Method', 'Tx_Count', 'Gross_Amount', 'Refund_Amount', 'Net_Amount', 'Updated_At'
  ],
  Inventory_Summary: [
    'Item_Type', 'Item_ID', 'Name', 'Unit', 'Current_Stock',
    'Min_Stock', 'Status', 'Unit_Cost', 'Total_Value', 'Updated_At'
  ],
  Shift_Summary: [
    'Session_ID', 'Username', 'Open_Time', 'Close_Time', 'Opening_Cash',
    'Cash_Sales', 'Cash_Refunds', 'Cash_Expenses', 'Expected_Cash',
    'Actual_Cash', 'Difference', 'Status'
  ]
};

// ============================================================================
// 2. HTTP ROUTER (doGet & doPost)
// ============================================================================
function doGet(e) {
  try {
    ensureDatabaseInitialized();
  } catch (err) {
    Logger.log('Init warning on doGet: ' + err.message);
  }
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('UsahaOS - Platform Manajemen Operasional & Intelijen Bisnis Berbasis AI')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}

function doPost(e) {
  const sendJSON = (obj) => {
    if (obj && typeof obj === 'object' && obj.error && obj.success === undefined) {
      obj.success = false;
    }
    return ContentService.createTextOutput(JSON.stringify(obj))
      .setMimeType(ContentService.MimeType.JSON);
  };

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return sendJSON({ error: 'Payload request kosong atau tidak valid.' });
    }

    let payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return sendJSON({ error: 'Format JSON tidak valid: ' + parseErr.message });
    }

    const action = String(payload.action || '').trim();
    if (!action) {
      return sendJSON({ error: 'Parameter action wajib disertakan.' });
    }

    // Pastikan database terinisialisasi
    try {
      ensureDatabaseInitialized();
    } catch (dbErr) {
      return sendJSON({
        error: 'Gagal terhubung ke Google Sheets Database (' + DB_ID + '). Pastikan Spreadsheet tersedia dan memiliki izin akses: ' + dbErr.message,
        errorType: 'DB_ERROR'
      });
    }

    // Endpoint publik (tanpa token sesi)
    if (action === 'login') {
      return sendJSON(loginUser(payload));
    }
    if (action === 'ping') {
      return sendJSON({ success: true, stage: 'PING_OK', timestamp: nowStr(), dbId: DB_ID });
    }
    if (action === 'checkSetup') {
      return sendJSON(checkSystemSetup());
    }
    if (action === 'setupAccount') {
      return sendJSON(setupInitialOwnerAccount(payload));
    }

    // Validasi sesi token di backend (mendukung field token, sessionToken, atau authToken)
    const rawToken = payload.token !== undefined ? payload.token : (payload.sessionToken !== undefined ? payload.sessionToken : payload.authToken);
    const token = String(rawToken || '').trim();
    const sessionCheck = validateSessionTokenWithDiag(token);
    if (!sessionCheck.valid || !sessionCheck.user) {
      return sendJSON({
        error: sessionCheck.message || 'Sesi Anda telah berakhir atau tidak valid. Silakan login kembali.',
        unauthorized: true,
        errorCode: 'SESSION_INVALID',
        stage: sessionCheck.stage || 'SESSION_INVALID',
        dbId: DB_ID
      });
    }
    const sessionUser = sessionCheck.user;

    if (action === 'logout') {
      return sendJSON(logoutUser(token, sessionUser));
    }
    if (action === 'getSessionInfo' || action === 'validateSession') {
      return sendJSON({
        success: true,
        stage: 'SESSION_VALIDATED',
        dbId: DB_ID,
        user: sessionUser
      });
    }

    // Pemeriksaan RBAC (Role-Based Access Control) di Backend
    const role = sessionUser.role; // 'Owner', 'Admin', 'Kasir'
    const adminOrOwnerActions = [
      'getDashboardAnalytics', 'getDashboardData',
      'saveProduct', 'deleteProduct', 'addProductStock', 'updateStock',
      'saveCategory', 'deleteCategory',
      'getMaterials', 'saveMaterial', 'deleteMaterial', 'adjustMaterialStock',
      'getBOM', 'saveProductBOM',
      'saveModifier', 'deleteModifier', 'saveModifierGroup', 'deleteModifierGroup',
      'saveDiscount', 'deleteDiscount',
      'getEmployeesAndShifts', 'saveEmployee', 'deleteEmployee', 'resetEmployeePassword',
      'saveShiftSchedule', 'deleteShiftSchedule',
      'getFinanceData', 'processRefund', 'verifyTransactionPayment',
      'saveStoreSettings', 'getStockMovements',
      'askAI', 'refreshAnalyticsSummaries', 'verifyDatabaseSchema'
    ];
    const ownerOnlyActions = [
      'saveOwnerSecretSettings', 'testGroqConnection', 'triggerManualBackup', 'resetDefaultAccounts'
    ];

    if (ownerOnlyActions.indexOf(action) !== -1 && role !== 'Owner') {
      return sendJSON({ error: 'Akses Ditolak: Fitur ini hanya dapat diakses oleh Owner.', errorCode: 'FORBIDDEN' });
    }
    if (adminOrOwnerActions.indexOf(action) !== -1 && role !== 'Admin' && role !== 'Owner') {
      return sendJSON({ error: 'Akses Ditolak: Fitur ini memerlukan hak akses Admin atau Owner.', errorCode: 'FORBIDDEN' });
    }

    let result;
    switch (action) {
      // Bootstrap & Kasir POS
      case 'getInitialData':
      case 'getPOSBootstrap':
        result = getPOSBootstrap(sessionUser);
        break;
      case 'processTransaction':
      case 'saveOrder':
      case 'submitCheckout':
        result = processTransaction(payload, sessionUser);
        break;
      case 'getTransactionReceipt':
        result = getTransactionReceipt(payload.txId);
        break;
      case 'getCashierRecentTransactions':
        result = getCashierRecentTransactions(sessionUser);
        break;

      // Shift & Modal Kas Laci
      case 'getActiveShiftSession':
        result = getActiveShiftSession(sessionUser);
        break;
      case 'openShiftSession':
        result = openShiftSession(payload, sessionUser);
        break;
      case 'recordCashExpense':
        result = recordCashExpense(payload, sessionUser);
        break;
      case 'closeShiftSession':
        result = closeShiftSession(payload, sessionUser);
        break;

      // Produk & Kategori
      case 'saveProduct':
        result = saveProduct(payload, sessionUser);
        break;
      case 'deleteProduct':
        result = deleteProduct(payload, sessionUser);
        break;
      case 'addProductStock':
      case 'updateStock':
        result = addProductStock(payload, sessionUser);
        break;
      case 'saveCategory':
        result = saveCategory(payload, sessionUser);
        break;
      case 'deleteCategory':
        result = deleteCategory(payload, sessionUser);
        break;

      // Bahan Baku (Materials), BOM & Mutasi Stok
      case 'getMaterials':
        result = { success: true, materials: getMaterialsList(true) };
        break;
      case 'saveMaterial':
        result = saveMaterial(payload, sessionUser);
        break;
      case 'deleteMaterial':
        result = deleteMaterial(payload, sessionUser);
        break;
      case 'adjustMaterialStock':
        result = adjustMaterialStock(payload, sessionUser);
        break;
      case 'getBOM':
        result = getBOMData(payload.productId);
        break;
      case 'saveProductBOM':
        result = saveProductBOM(payload, sessionUser);
        break;
      case 'getStockMovements':
        result = getStockMovements(payload);
        break;

      // Modifier & Grup Modifier
      case 'getModifiers':
        result = {
          success: true,
          modifiers: getModifiersList(true),
          modifierGroups: getModifierGroupsList(true)
        };
        break;
      case 'saveModifier':
        result = saveModifier(payload, sessionUser);
        break;
      case 'deleteModifier':
        result = deleteModifier(payload, sessionUser);
        break;
      case 'saveModifierGroup':
        result = saveModifierGroup(payload, sessionUser);
        break;
      case 'deleteModifierGroup':
        result = deleteModifierGroup(payload, sessionUser);
        break;

      // Diskon & Member Loyalitas
      case 'getDiscounts':
        result = { success: true, discounts: getDiscountsList(true) };
        break;
      case 'saveDiscount':
        result = saveDiscount(payload, sessionUser);
        break;
      case 'deleteDiscount':
        result = deleteDiscount(payload, sessionUser);
        break;
      case 'getMembers':
      case 'searchMembers':
        result = searchMembers(payload);
        break;
      case 'getMemberDetail':
        result = getMemberDetail(payload);
        break;
      case 'saveMember':
        result = saveMember(payload, sessionUser);
        break;

      // Karyawan, Akun & Jadwal Shift
      case 'getEmployeesAndShifts':
        result = getEmployeesAndShifts();
        break;
      case 'saveEmployee':
        result = saveEmployee(payload, sessionUser);
        break;
      case 'deleteEmployee':
        result = deleteEmployee(payload, sessionUser);
        break;
      case 'resetEmployeePassword':
        result = resetEmployeePassword(payload, sessionUser);
        break;
      case 'changeOwnPassword':
        result = changeOwnPassword(payload, sessionUser);
        break;
      case 'saveShiftSchedule':
        result = saveShiftSchedule(payload, sessionUser);
        break;
      case 'deleteShiftSchedule':
        result = deleteShiftSchedule(payload, sessionUser);
        break;

      // Keuangan, Verifikasi & Refund
      case 'getFinanceData':
        result = getFinanceData(payload);
        break;
      case 'verifyTransactionPayment':
        result = verifyTransactionPayment(payload, sessionUser);
        break;
      case 'processRefund':
        result = processRefund(payload, sessionUser);
        break;

      // Dashboard & AI Analytics
      case 'getDashboardData':
      case 'getDashboardAnalytics':
        result = getDashboardAnalytics(payload);
        break;
      case 'refreshAnalyticsSummaries':
        result = refreshAnalyticsSummaries();
        break;
      case 'askAI':
        result = askGroqBusinessAnalyst(payload, sessionUser);
        break;

      // Pengaturan Toko & Owner Secret
      case 'getStoreSettings':
        result = getStoreSettings(sessionUser);
        break;
      case 'saveStoreSettings':
        result = saveStoreSettings(payload, sessionUser);
        break;
      case 'saveOwnerSecretSettings':
        result = saveOwnerSecretSettings(payload, sessionUser);
        break;
      case 'testGroqConnection':
        result = testGroqConnection(payload);
        break;
      case 'triggerManualBackup':
        result = triggerManualBackup(sessionUser);
        break;
      case 'verifyDatabaseSchema':
        result = verifyDatabaseSchema();
        break;
      case 'resetDefaultAccounts':
        result = resetDefaultAccounts();
        break;

      default:
        result = { error: 'Action tidak dikenali: ' + action };
    }

    return sendJSON(result);
  } catch (err) {
    Logger.log('Fatal Error in doPost: ' + err.stack);
    return sendJSON({ error: 'Kesalahan Server Internal: ' + err.message });
  }
}

// ============================================================================
// 3. UTILITAS DATABASE, WAKTU, DAN PEMERIKSAAN SKEMA
// ============================================================================
let _cachedSpreadsheet = null;
function getDB() {
  if (!_cachedSpreadsheet) {
    _cachedSpreadsheet = SpreadsheetApp.openById(DB_ID);
  }
  return _cachedSpreadsheet;
}

function nowStr() {
  return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss');
}

function todayStr() {
  return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
}

function normalizeDateWIB(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, TZ, 'yyyy-MM-dd');
  }
  const s = String(val).trim();
  const mIso = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (mIso) return mIso[1];
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return Utilities.formatDate(d, TZ, 'yyyy-MM-dd');
  }
  return s.substring(0, 10);
}

function formatTimestampWIB(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, TZ, 'yyyy-MM-dd HH:mm:ss');
  }
  return String(val).trim();
}

function generateId(prefix) {
  const ts = Utilities.formatDate(new Date(), TZ, 'yyMMddHHmmss');
  const rand = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${ts}-${rand}`;
}

function getHeaderMap(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) return {};
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const map = {};
  for (let i = 0; i < headers.length; i++) {
    const key = String(headers[i] || '').trim();
    if (key) map[key] = i;
  }
  return map;
}

function readSheetObjects(sheetName) {
  const ss = getDB();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0].map(h => String(h || '').trim());
  const list = [];
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const obj = { _rowIndex: r + 1 };
    let hasValue = false;
    for (let c = 0; c < headers.length; c++) {
      if (headers[c]) {
        obj[headers[c]] = row[c];
        if (row[c] !== '' && row[c] !== null && row[c] !== undefined) hasValue = true;
      }
    }
    if (hasValue) list.push(obj);
  }
  return list;
}

function appendObjectRow(sheetName, rowObj, textColumns) {
  const ss = getDB();
  const sheet = ensureSheetExists(ss, sheetName, SCHEMA[sheetName] || Object.keys(rowObj));
  const lastCol = Math.max(1, sheet.getLastColumn());
  const rawHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || '').trim());
  const headers = rawHeaders.some(Boolean) ? rawHeaders : (SCHEMA[sheetName] || Object.keys(rowObj));
  const rowValues = headers.map(col => (rowObj[col] !== undefined && rowObj[col] !== null) ? rowObj[col] : '');
  const nextRow = sheet.getLastRow() + 1;
  const range = sheet.getRange(nextRow, 1, 1, rowValues.length);
  if (textColumns && textColumns.length > 0) {
    textColumns.forEach(colName => {
      const idx = headers.indexOf(colName);
      if (idx !== -1) {
        sheet.getRange(nextRow, idx + 1).setNumberFormat('@');
      }
    });
  }
  range.setValues([rowValues]);
  return nextRow;
}

function updateObjectRow(sheetName, rowIndex, updatesObj, textColumns) {
  const ss = getDB();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || !rowIndex || rowIndex < 2) return false;
  const hMap = getHeaderMap(sheet);
  const lastCol = sheet.getLastColumn();
  const rowRange = sheet.getRange(rowIndex, 1, 1, lastCol);
  const currentRow = rowRange.getValues()[0];

  Object.keys(updatesObj).forEach(col => {
    if (hMap[col] !== undefined) {
      if (textColumns && textColumns.indexOf(col) !== -1) {
        sheet.getRange(rowIndex, hMap[col] + 1).setNumberFormat('@');
      }
      currentRow[hMap[col]] = updatesObj[col];
    }
  });
  rowRange.setValues([currentRow]);
  return true;
}

function ensureSheetExists(ss, sheetName, expectedHeaders) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastRow === 0 || lastCol === 0) {
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    sheet.getRange(1, 1, 1, expectedHeaders.length)
      .setFontWeight('bold')
      .setBackground('#EFF6FF')
      .setFontColor('#1E3A8A');
    sheet.setFrozenRows(1);
    return sheet;
  }

  const existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || '').trim());
  const missingHeaders = [];
  expectedHeaders.forEach(h => {
    if (existingHeaders.indexOf(h) === -1) {
      missingHeaders.push(h);
    }
  });

  if (missingHeaders.length > 0) {
    const startCol = lastCol + 1;
    sheet.getRange(1, startCol, 1, missingHeaders.length).setValues([missingHeaders]);
    sheet.getRange(1, startCol, 1, missingHeaders.length)
      .setFontWeight('bold')
      .setBackground('#EFF6FF')
      .setFontColor('#1E3A8A');
  }
  return sheet;
}

/**
 * Fungsi publik yang dapat dijalankan langsung dari editor Google Apps Script
 * untuk menginisialisasi seluruh struktur database pada Spreadsheet Dummy secara idempotent.
 */
function setupDatabase() {
  const ss = getDB();
  Object.keys(SCHEMA).forEach(sheetName => {
    ensureSheetExists(ss, sheetName, SCHEMA[sheetName]);
  });

  // Format kolom Phone di Members dan Users sebagai Plain Text ('@') agar leading zero '08...' terjaga
  const memSheet = ss.getSheetByName('Members');
  if (memSheet) {
    const hMap = getHeaderMap(memSheet);
    if (hMap['Phone'] !== undefined) {
      memSheet.getRange(2, hMap['Phone'] + 1, Math.max(1, memSheet.getMaxRows() - 1), 1).setNumberFormat('@');
    }
  }

  seedInitialSettings(ss);
  seedInitialUsers(ss);
  seedInitialCategoriesAndProducts(ss);
  seedInitialMaterialsAndBOM(ss);
  seedInitialModifiers(ss);
  seedInitialDiscountsAndMembers(ss);

  PropertiesService.getScriptProperties().setProperty('DB_INITIALIZED_V3_' + DB_ID, 'true');
  return verifyDatabaseSchema();
}

let _dbInitVerified = false;
function ensureDatabaseInitialized() {
  if (_dbInitVerified) return; // instance hangat: cek skema sudah lolos, hindari baca Properties+Sheet tiap request
  const props = PropertiesService.getScriptProperties();
  const flagKey = 'DB_INITIALIZED_V3_' + DB_ID;
  const ss = getDB();
  const usersSheet = ss.getSheetByName('Users');
  const modGroupsSheet = ss.getSheetByName('Modifier_Groups');
  const cashMgmtSheet = ss.getSheetByName('Cash_Management');

  if (props.getProperty(flagKey) === 'true' && usersSheet && usersSheet.getLastRow() > 1 && modGroupsSheet && cashMgmtSheet) {
    _dbInitVerified = true;
    return;
  }

  const lock = LockService.getScriptLock();
  if (lock.tryLock(15000)) {
    try {
      setupDatabase();
    } finally {
      lock.releaseLock();
    }
  }
}

/**
 * Memeriksa kelengkapan nama tab dan header kolom pada Spreadsheet Dummy tanpa menghapus data.
 */
function verifyDatabaseSchema() {
  const ss = getDB();
  const report = {
    success: true,
    isValid: true,
    spreadsheetId: DB_ID,
    spreadsheetName: ss.getName(),
    checkedAt: nowStr(),
    missingTabs: [],
    missingColumns: {},
    tabsSummary: []
  };

  Object.keys(SCHEMA).forEach(tabName => {
    const expectedCols = SCHEMA[tabName];
    const sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      report.isValid = false;
      report.missingTabs.push(tabName);
      report.tabsSummary.push({ tab: tabName, exists: false, rowCount: 0, missingColumns: expectedCols });
    } else {
      const lastCol = sheet.getLastColumn();
      const actualCols = lastCol > 0
        ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || '').trim())
        : [];
      const missing = expectedCols.filter(c => actualCols.indexOf(c) === -1);
      if (missing.length > 0) {
        report.isValid = false;
        report.missingColumns[tabName] = missing;
      }
      report.tabsSummary.push({
        tab: tabName,
        exists: true,
        rowCount: Math.max(0, sheet.getLastRow() - 1),
        missingColumns: missing
      });
    }
  });

  return report;
}

function logActivity(actor, role, action, target, details) {
  try {
    appendObjectRow('Activity_Logs', {
      Log_ID: generateId('LOG'),
      Timestamp: nowStr(),
      Actor: actor || 'SYSTEM',
      Role: role || '-',
      Action: action,
      Target: target || '-',
      Details: typeof details === 'object' ? JSON.stringify(details) : String(details || '')
    });
  } catch (e) {
    Logger.log('Log activity error: ' + e.message);
  }
}

// ============================================================================
// 4. SEED DATA AWAL (IDEMPOTENT - TIDAK MENGGANDAKAN DATA)
// ============================================================================
function seedInitialSettings(ss) {
  const sheet = ss.getSheetByName('Settings');
  const existing = readSheetObjects('Settings');
  const existingKeys = {};
  existing.forEach(r => { existingKeys[String(r.Key).trim()] = true; });

  const defaults = [
    ['store_name', 'UsahaOS', 'Nama usaha pada struk'],
    ['store_tagline', 'Specialty Coffee & Collaborative Space', 'Tagline struk'],
    ['store_address', 'Jl. Kopi Nusantara No. 88, Jakarta', 'Alamat usaha pada struk'],
    ['store_phone', '0812-8888-9999', 'Nomor telepon usaha pada struk'],
    ['store_logo_url', '', 'URL logo opsional'],
    ['tax_enabled', 'true', 'Aktifkan perhitungan pajak PB1'],
    ['tax_name', 'PB1', 'Nama pajak restoran'],
    ['tax_rate', '10', 'Persentase pajak (%)'],
    ['tax_mode', 'EXCLUSIVE', 'EXCLUSIVE (tambah pajak) atau INCLUSIVE (termasuk pajak)'],
    ['rounding_mode', 'NONE', 'NONE, NEAREST_100, NEAREST_500, UP_100, DOWN_100'],
    ['receipt_footer', 'Terima kasih atas kunjungan Anda!', 'Pesan catatan kaki struk'],
    ['receipt_paper_size', '80mm', '80mm atau 58mm'],
    ['qris_merchant_name', 'USAHAOS DEMO', 'Nama Merchant QRIS'],
    ['qris_nmid', 'ID102500889911', 'NMID QRIS'],
    ['qris_image_url', '', 'URL gambar QRIS statis (opsional)'],
    ['bank_name', 'BCA', 'Nama Bank Transfer'],
    ['bank_account_number', '8720192837', 'Nomor Rekening Transfer'],
    ['bank_account_holder', 'Demo UsahaOS', 'Nama Pemilik Rekening'],
    ['member_points_per_rupiah', '10000', 'Belanja Rp X mendapatkan 1 poin'],
    ['member_rupiah_per_point', '500', '1 poin bernilai potongan Rp Y'],
    ['require_open_shift', 'true', 'Wajib buka shift sebelum kasir transaksi'],
    ['enforce_shift_schedule', 'false', 'Batasi login kasir sesuai jam jadwal shift'],
    ['ai_model', DEFAULT_GROQ_MODEL, 'Model AI Groq default']
  ];

  const now = nowStr();
  defaults.forEach(item => {
    if (!existingKeys[item[0]]) {
      appendObjectRow('Settings', {
        Key: item[0],
        Value: item[1],
        Description: item[2],
        Updated_At: now
      });
    }
  });

  // Pastikan model AI di ScriptProperties juga selaras dengan openai/gpt-oss-120b jika belum diset
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('GROQ_MODEL_NAME')) {
    props.setProperty('GROQ_MODEL_NAME', DEFAULT_GROQ_MODEL);
  }
}

function hashPasswordWithSalt(password, salt) {
  const raw = String(salt) + '::NGASIH_KOPI_SEC_V3::' + String(password);
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
  return digest.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

function seedInitialUsers(ss) {
  const existing = readSheetObjects('Users');
  const byUsername = {};
  existing.forEach(u => {
    const uname = String(u.Username || '').trim().toLowerCase();
    if (uname) byUsername[uname] = u;
  });

  const initialUsers = [
    { id: 'USR-001', username: 'owner', pass: 'owner123', role: 'Owner', fullName: 'Owner UsahaOS', phone: '0811000001' },
    { id: 'USR-002', username: 'admin', pass: 'admin123', role: 'Admin', fullName: 'Admin Operasional', phone: '0811000002' },
    { id: 'USR-003', username: 'kasir', pass: 'kasir123', role: 'Kasir', fullName: 'Kasir Utama', phone: '0811000003' }
  ];

  const now = nowStr();
  initialUsers.forEach(u => {
    const existingUser = byUsername[u.username];
    if (!existingUser) {
      const salt = Utilities.getUuid().replace(/-/g, '').substring(0, 16);
      const hash = hashPasswordWithSalt(u.pass, salt);
      appendObjectRow('Users', {
        User_ID: u.id,
        Username: u.username,
        Password_Hash: hash,
        Salt: salt,
        Role: u.role,
        Full_Name: u.fullName,
        Status: 'Active',
        Phone: u.phone,
        Must_Change_Password: false,
        Created_At: now,
        Last_Login: ''
      }, ['Phone']);
    } else if (!existingUser.Password_Hash || !existingUser.Salt) {
      // Perbaiki jika akun sudah ada tetapi belum memiliki hash/salt yang valid
      const salt = Utilities.getUuid().replace(/-/g, '').substring(0, 16);
      const hash = hashPasswordWithSalt(u.pass, salt);
      updateObjectRow('Users', existingUser._rowIndex, {
        Password_Hash: hash,
        Salt: salt,
        Role: existingUser.Role || u.role,
        Status: existingUser.Status || 'Active'
      });
    }
  });

  // Seed jadwal shift default (24 jam semua hari agar kasir tidak terkunci di awal)
  const shifts = readSheetObjects('Shifts');
  if (shifts.length === 0) {
    appendObjectRow('Shifts', {
      Shift_ID: 'SHF-001',
      Username: 'kasir',
      Full_Name: 'Kasir Utama',
      Shift_Name: 'Shift Reguler',
      Day_Of_Week: 'ALL',
      Start_Time: '00:00',
      End_Time: '23:59',
      Is_Active: true
    });
  }
}

/**
 * Fungsi reset kredensial akun default secara aman tanpa membuat akun duplikat.
 * Dapat dipanggil langsung dari Apps Script editor jika diperlukan.
 */
function resetDefaultAccounts() {
  const ss = getDB();
  ensureSheetExists(ss, 'Users', SCHEMA.Users);
  const existing = readSheetObjects('Users');
  const byUsername = {};
  existing.forEach(u => {
    const uname = String(u.Username || '').trim().toLowerCase();
    if (uname) byUsername[uname] = u;
  });

  const defaults = [
    { id: 'USR-001', username: 'owner', pass: 'owner123', role: 'Owner', fullName: 'Owner UsahaOS', phone: '0811000001' },
    { id: 'USR-002', username: 'admin', pass: 'admin123', role: 'Admin', fullName: 'Admin Operasional', phone: '0811000002' },
    { id: 'USR-003', username: 'kasir', pass: 'kasir123', role: 'Kasir', fullName: 'Kasir Utama', phone: '0811000003' }
  ];

  const now = nowStr();
  defaults.forEach(u => {
    const salt = Utilities.getUuid().replace(/-/g, '').substring(0, 16);
    const hash = hashPasswordWithSalt(u.pass, salt);
    if (byUsername[u.username]) {
      updateObjectRow('Users', byUsername[u.username]._rowIndex, {
        Password_Hash: hash,
        Salt: salt,
        Role: u.role,
        Status: 'Active',
        Must_Change_Password: false
      });
    } else {
      appendObjectRow('Users', {
        User_ID: u.id,
        Username: u.username,
        Password_Hash: hash,
        Salt: salt,
        Role: u.role,
        Full_Name: u.fullName,
        Status: 'Active',
        Phone: u.phone,
        Must_Change_Password: false,
        Created_At: now,
        Last_Login: ''
      }, ['Phone']);
    }
  });

  return {
    success: true,
    message: 'Kredensial akun awal (owner/admin/kasir) telah diverifikasi dan direset dengan hash SHA-256 + salt.'
  };
}

function seedInitialCategoriesAndProducts(ss) {
  const existingCats = readSheetObjects('Categories');
  if (existingCats.length === 0) {
    const cats = [
      ['CAT-01', 'Kopi', 'Minuman berbasis espresso & manual brew', 1, 'blue', true],
      ['CAT-02', 'Non-Kopi', 'Minuman coklat, matcha, teh & segar', 2, 'teal', true],
      ['CAT-03', 'Makanan', 'Hidangan utama & makanan berat kafe', 3, 'emerald', true],
      ['CAT-04', 'Snack', 'Camilan, pastry & roti pendamping kopi', 4, 'amber', true]
    ];
    cats.forEach(c => {
      appendObjectRow('Categories', {
        Category_ID: c[0], Name: c[1], Description: c[2], Sort_Order: c[3], Color_Theme: c[4], Is_Active: c[5]
      });
    });
  }

  const existingProds = readSheetObjects('Products');
  if (existingProds.length === 0) {
    const now = nowStr();
    const prods = [
      ['PRD-001', 'NK-KP01', 'Es Kopi Susu Ngasih', 'Kopi', 22000, 7500, 60, 10, '', 'Signature es kopi susu gula aren khas Ngasih Kopi', true, 'blue', true],
      ['PRD-002', 'NK-KP02', 'Iced Americano Arabica', 'Kopi', 18000, 4800, 70, 10, '', 'Double shot espresso 100% Arabica dengan air dingin', true, 'indigo', true],
      ['PRD-003', 'NK-KP03', 'Cappuccino Classic', 'Kopi', 25000, 8200, 45, 8, '', 'Espresso dengan steamed fresh milk dan foam lembut', true, 'cyan', true],
      ['PRD-004', 'NK-KP04', 'Caramel Macchiato', 'Kopi', 28000, 9500, 40, 8, '', 'Perpaduan espresso, vanilla, susu segar dan saus karamel', true, 'sky', true],
      ['PRD-005', 'NK-NK01', 'Uji Matcha Latte', 'Non-Kopi', 26000, 8900, 40, 8, '', 'Pure Uji Matcha Jepang dengan susu segar pilihan', true, 'teal', true],
      ['PRD-006', 'NK-NK02', 'Signature Dark Chocolate', 'Non-Kopi', 25000, 8400, 45, 8, '', 'Minuman coklat pekat premium disajikan dingin atau hangat', true, 'violet', true],
      ['PRD-007', 'NK-NK03', 'Lychee Yakult Breeze', 'Non-Kopi', 23000, 7200, 35, 8, '', 'Minuman segar perpaduan leci dan yakult', false, 'rose', true],
      ['PRD-008', 'NK-MK01', 'Nasi Goreng Spesial Ngasih', 'Makanan', 32000, 14500, 30, 5, '', 'Nasi goreng rempah dengan telur, ayam suwir dan kerupuk', true, 'emerald', true],
      ['PRD-009', 'NK-MK02', 'Rice Bowl Chicken Sambal Matah', 'Makanan', 30000, 13500, 25, 5, '', 'Nasi hangat dengan crispy chicken dan sambal matah segar', false, 'green', true],
      ['PRD-010', 'NK-SN01', 'Butter Croissant Artisan', 'Snack', 20000, 8500, 25, 5, '', 'Croissant renyah berlapis dengan French butter', true, 'amber', true],
      ['PRD-011', 'NK-SN02', 'French Fries Truffle Mayo', 'Snack', 22000, 8000, 35, 5, '', 'Kentang goreng renyah dengan saus truffle mayo', false, 'orange', true]
    ];
    prods.forEach(p => {
      appendObjectRow('Products', {
        Product_ID: p[0], SKU: p[1], Name: p[2], Category: p[3], Price: p[4], Cost: p[5],
        Stock: p[6], Min_Stock: p[7], Image_URL: p[8], Description: p[9], Use_BOM: p[10],
        Color_Theme: p[11], Is_Active: p[12], Created_At: now, Updated_At: now
      });
    });
  }
}

function seedInitialMaterialsAndBOM(ss) {
  const existingMats = readSheetObjects('Materials');
  if (existingMats.length === 0) {
    const now = nowStr();
    const mats = [
      ['MAT-001', 'ING-COFFEE', 'Biji Kopi Arabica House Blend', 'gram', 5000, 500, 220, 'Roastery Nusantara', true],
      ['MAT-002', 'ING-MILK', 'Susu Segar Pasteurisasi', 'ml', 20000, 2000, 22, 'Greenfields Dairy', true],
      ['MAT-003', 'ING-AREN', 'Sirup Gula Aren Organik', 'ml', 5000, 500, 45, 'Aren Banten', true],
      ['MAT-004', 'ING-MATCHA', 'Bubuk Pure Matcha Jepang', 'gram', 1500, 200, 300, 'Kyoto Imports', true],
      ['MAT-005', 'ING-CHOCO', 'Bubuk Dark Chocolate 70%', 'gram', 2500, 300, 180, 'Kakao Jaya', true],
      ['MAT-006', 'ING-CUP', 'Cup & Lid Takeaway 16oz', 'pcs', 400, 50, 900, 'Packindo', true],
      ['MAT-007', 'ING-CROIS', 'Dough Croissant Beku', 'pcs', 40, 10, 8500, 'Artisan Bakery', true],
      ['MAT-008', 'ING-RICE', 'Beras & Bumbu Nasi Goreng Porsi', 'gram', 6000, 1000, 45, 'Pangan Segar', true]
    ];
    mats.forEach(m => {
      appendObjectRow('Materials', {
        Material_ID: m[0], SKU: m[1], Name: m[2], Unit: m[3], Stock: m[4],
        Min_Stock: m[5], Cost_Per_Unit: m[6], Supplier: m[7], Is_Active: m[8], Updated_At: now
      });
    });
  }

  const existingBom = readSheetObjects('BOM');
  if (existingBom.length === 0) {
    const now = nowStr();
    const boms = [
      // Es Kopi Susu Ngasih (PRD-001)
      ['BOM-001', 'PRD-001', 'MAT-001', 18, 'gram', 2],
      ['BOM-002', 'PRD-001', 'MAT-002', 120, 'ml', 0],
      ['BOM-003', 'PRD-001', 'MAT-003', 25, 'ml', 0],
      ['BOM-004', 'PRD-001', 'MAT-006', 1, 'pcs', 0],
      // Iced Americano (PRD-002)
      ['BOM-005', 'PRD-002', 'MAT-001', 18, 'gram', 2],
      ['BOM-006', 'PRD-002', 'MAT-006', 1, 'pcs', 0],
      // Cappuccino (PRD-003)
      ['BOM-007', 'PRD-003', 'MAT-001', 18, 'gram', 2],
      ['BOM-008', 'PRD-003', 'MAT-002', 150, 'ml', 2],
      ['BOM-009', 'PRD-003', 'MAT-006', 1, 'pcs', 0],
      // Caramel Macchiato (PRD-004)
      ['BOM-010', 'PRD-004', 'MAT-001', 18, 'gram', 2],
      ['BOM-011', 'PRD-004', 'MAT-002', 150, 'ml', 2],
      ['BOM-012', 'PRD-004', 'MAT-006', 1, 'pcs', 0],
      // Uji Matcha Latte (PRD-005)
      ['BOM-013', 'PRD-005', 'MAT-004', 15, 'gram', 0],
      ['BOM-014', 'PRD-005', 'MAT-002', 150, 'ml', 0],
      ['BOM-015', 'PRD-005', 'MAT-006', 1, 'pcs', 0],
      // Signature Dark Chocolate (PRD-006)
      ['BOM-016', 'PRD-006', 'MAT-005', 25, 'gram', 0],
      ['BOM-017', 'PRD-006', 'MAT-002', 150, 'ml', 0],
      ['BOM-018', 'PRD-006', 'MAT-006', 1, 'pcs', 0],
      // Nasi Goreng Spesial (PRD-008)
      ['BOM-019', 'PRD-008', 'MAT-008', 250, 'gram', 0],
      // Butter Croissant (PRD-010)
      ['BOM-020', 'PRD-010', 'MAT-007', 1, 'pcs', 0]
    ];
    boms.forEach(b => {
      appendObjectRow('BOM', {
        BOM_ID: b[0], Product_ID: b[1], Material_ID: b[2], Qty: b[3], Unit: b[4], Waste_Pct: b[5], Updated_At: now
      });
    });
  }
}

function seedInitialModifiers(ss) {
  const existingGroups = readSheetObjects('Modifier_Groups');
  if (existingGroups.length === 0) {
    const groups = [
      // Grup khusus Minuman (Kopi, Non-Kopi, Minuman)
      ['MGRP-01', 'Level Gula', 'SINGLE', true, 1, 1, 'Kopi,Non-Kopi,Minuman', '', 1, true],
      ['MGRP-02', 'Level Es', 'SINGLE', true, 1, 1, 'Kopi,Non-Kopi,Minuman', '', 2, true],
      ['MGRP-03', 'Add-On Minuman', 'MULTIPLE', false, 0, 3, 'Kopi,Non-Kopi,Minuman', '', 3, true],
      // Grup khusus Makanan
      ['MGRP-04', 'Tingkat Kepedasan', 'SINGLE', true, 1, 1, 'Makanan', '', 4, true],
      ['MGRP-05', 'Tambahan Lauk Makanan', 'MULTIPLE', false, 0, 3, 'Makanan', '', 5, true],
      // Grup khusus Snack
      ['MGRP-06', 'Opsi Penyajian Snack', 'SINGLE', false, 0, 1, 'Snack', '', 6, true]
    ];
    groups.forEach(g => {
      appendObjectRow('Modifier_Groups', {
        Group_ID: g[0], Group_Name: g[1], Selection_Type: g[2], Is_Required: g[3],
        Min_Choice: g[4], Max_Choice: g[5], Categories: g[6], Product_IDs: g[7], Sort_Order: g[8], Is_Active: g[9]
      });
    });
  }

  const existingMods = readSheetObjects('Modifiers');
  if (existingMods.length === 0) {
    const mods = [
      // Level Gula (Minuman)
      ['MOD-001', 'MGRP-01', 'Level Gula', 'Normal Sugar (100%)', 0, true, 1, 1, 'Kopi,Non-Kopi,Minuman', '', '', 0, true],
      ['MOD-002', 'MGRP-01', 'Level Gula', 'Less Sugar (70%)', 0, true, 1, 1, 'Kopi,Non-Kopi,Minuman', '', '', 0, true],
      ['MOD-003', 'MGRP-01', 'Level Gula', 'Half Sugar (50%)', 0, true, 1, 1, 'Kopi,Non-Kopi,Minuman', '', '', 0, true],
      ['MOD-004', 'MGRP-01', 'Level Gula', 'No Sugar (0%)', 0, true, 1, 1, 'Kopi,Non-Kopi,Minuman', '', '', 0, true],
      // Level Es (Minuman)
      ['MOD-005', 'MGRP-02', 'Level Es', 'Normal Ice', 0, true, 1, 1, 'Kopi,Non-Kopi,Minuman', '', '', 0, true],
      ['MOD-006', 'MGRP-02', 'Level Es', 'Less Ice', 0, true, 1, 1, 'Kopi,Non-Kopi,Minuman', '', '', 0, true],
      ['MOD-007', 'MGRP-02', 'Level Es', 'Disajikan Hangat (Hot)', 0, true, 1, 1, 'Kopi,Non-Kopi,Minuman', '', '', 0, true],
      // Add-On Minuman
      ['MOD-008', 'MGRP-03', 'Add-On Minuman', 'Extra Espresso Shot', 6000, false, 0, 3, 'Kopi,Non-Kopi,Minuman', '', 'MAT-001', 9, true],
      ['MOD-009', 'MGRP-03', 'Add-On Minuman', 'Upgrade Oat Milk', 8000, false, 0, 3, 'Kopi,Non-Kopi,Minuman', '', '', 0, true],
      ['MOD-010', 'MGRP-03', 'Add-On Minuman', 'Extra Aren Syrup', 4000, false, 0, 3, 'Kopi,Non-Kopi,Minuman', '', 'MAT-003', 15, true],
      // Tingkat Kepedasan (Makanan)
      ['MOD-011', 'MGRP-04', 'Tingkat Kepedasan', 'Tidak Pedas', 0, true, 1, 1, 'Makanan', '', '', 0, true],
      ['MOD-012', 'MGRP-04', 'Tingkat Kepedasan', 'Pedas Sedang', 0, true, 1, 1, 'Makanan', '', '', 0, true],
      ['MOD-013', 'MGRP-04', 'Tingkat Kepedasan', 'Ekstra Pedas', 0, true, 1, 1, 'Makanan', '', '', 0, true],
      // Tambahan Lauk Makanan (Makanan)
      ['MOD-014', 'MGRP-05', 'Tambahan Lauk Makanan', 'Tambah Telur Mata Sapi', 5000, false, 0, 3, 'Makanan', '', '', 0, true],
      ['MOD-015', 'MGRP-05', 'Tambahan Lauk Makanan', 'Tambah Ayam Crispy', 8000, false, 0, 3, 'Makanan', '', '', 0, true],
      ['MOD-016', 'MGRP-05', 'Tambahan Lauk Makanan', 'Ekstra Kerupuk', 3000, false, 0, 3, 'Makanan', '', '', 0, true],
      // Opsi Penyajian Snack (Snack)
      ['MOD-017', 'MGRP-06', 'Opsi Penyajian Snack', 'Hangatkan di Oven', 0, false, 0, 1, 'Snack', '', '', 0, true],
      ['MOD-018', 'MGRP-06', 'Opsi Penyajian Snack', 'Saus Sambal & Tomat Ekstra', 2000, false, 0, 1, 'Snack', '', '', 0, true]
    ];
    mods.forEach(m => {
      appendObjectRow('Modifiers', {
        Modifier_ID: m[0], Group_ID: m[1], Group_Name: m[2], Name: m[3], Price: m[4],
        Is_Required: m[5], Min_Choice: m[6], Max_Choice: m[7], Categories: m[8], Product_IDs: m[9],
        Material_ID: m[10], Material_Qty: m[11], Is_Active: m[12]
      });
    });
  } else {
    // Perbaiki data modifier lama yang mungkin belum memiliki kolom Categories (sehingga bocor ke semua produk)
    fixLegacyModifierCategories();
  }
}

function fixLegacyModifierCategories() {
  const mods = readSheetObjects('Modifiers');
  mods.forEach(m => {
    const grp = String(m.Group_Name || '').toLowerCase();
    const curCat = String(m.Categories || '').trim();
    const curProd = String(m.Product_IDs || '').trim();
    if (!curCat && !curProd) {
      let newCat = '';
      if (grp.indexOf('gula') !== -1 || grp.indexOf('sugar') !== -1 || grp.indexOf('es') !== -1 || grp.indexOf('ice') !== -1 || grp.indexOf('minuman') !== -1 || grp.indexOf('topping') !== -1 || grp.indexOf('add-on') !== -1) {
        newCat = 'Kopi,Non-Kopi,Minuman';
      } else if (grp.indexOf('pedas') !== -1 || grp.indexOf('makanan') !== -1 || grp.indexOf('lauk') !== -1) {
        newCat = 'Makanan';
      } else if (grp.indexOf('snack') !== -1 || grp.indexOf('penyajian') !== -1) {
        newCat = 'Snack';
      }
      if (newCat) {
        updateObjectRow('Modifiers', m._rowIndex, { Categories: newCat });
      }
    }
  });
}

function seedInitialDiscountsAndMembers(ss) {
  const existingDiscs = readSheetObjects('Discounts');
  if (existingDiscs.length === 0) {
    const discs = [
      ['DSC-001', 'HEMAT10', 'Diskon Pelanggan 10%', 'PERCENT', 10, 35000, 15000, '2025-01-01', '2028-12-31', 'ALL', '', false, true],
      ['DSC-002', 'MEMBER5K', 'Potongan Khusus Member Rp 5.000', 'NOMINAL', 5000, 25000, 5000, '2025-01-01', '2028-12-31', 'ALL', '', true, true]
    ];
    discs.forEach(d => {
      appendObjectRow('Discounts', {
        Discount_ID: d[0], Code: d[1], Title: d[2], Type: d[3], Value: d[4],
        Min_Purchase: d[5], Max_Discount: d[6], Start_Date: d[7], End_Date: d[8],
        Target_Category: d[9], Target_Product_IDs: d[10], Member_Only: d[11], Is_Active: d[12]
      });
    });
  }

  const existingMems = readSheetObjects('Members');
  if (existingMems.length === 0) {
    const now = nowStr();
    appendObjectRow('Members', {
      Member_ID: 'MEM-001',
      Name: 'Budi Santoso',
      Phone: '081234567890',
      Email: 'budi@example.com',
      Points: 50,
      Tier: 'Gold',
      Total_Spent: 250000,
      Visit_Count: 5,
      Notes: 'Suka Es Kopi Susu Less Sugar',
      Is_Active: true,
      Join_Date: now,
      Last_Visit: now
    }, ['Phone']);
  }
}

// ============================================================================
// 5. AUTENTIKASI, MANAJEMEN SESI, AKUN & JADWAL SHIFT
// ============================================================================
function checkSystemSetup() {
  try {
    const users = readSheetObjects('Users');
    const hasActiveUser = users.some(u => String(u.Username || '').trim() !== '' && String(u.Status || 'Active').toLowerCase() === 'active');
    return {
      success: true,
      stage: 'CHECK_SETUP_OK',
      isSetup: hasActiveUser,
      dbId: DB_ID
    };
  } catch (e) {
    return {
      success: false,
      stage: 'CHECK_SETUP_DB_ERROR',
      isSetup: true,
      error: 'Gagal memeriksa status setup database: ' + e.message,
      dbId: DB_ID
    };
  }
}

function setupInitialOwnerAccount(payload) {
  const users = readSheetObjects('Users');
  const hasOwner = users.some(u => String(u.Role || '').trim() === 'Owner' && String(u.Status || 'Active').toLowerCase() === 'active');
  if (hasOwner) {
    return {
      success: false,
      stage: 'SETUP_ALREADY_COMPLETED',
      error: 'Akun Owner sudah terdaftar di database. Silakan langsung login.'
    };
  }
  const fullName = String(payload.fullName || 'Owner UsahaOS').trim();
  const username = String(payload.username || 'owner').trim().toLowerCase();
  const password = String(payload.password || '');
  if (!username || password.length < 4) {
    return {
      success: false,
      stage: 'SETUP_INVALID_INPUT',
      error: 'Username dan password (minimal 4 karakter) wajib diisi.'
    };
  }
  const salt = Utilities.getUuid().replace(/-/g, '').substring(0, 16);
  const hash = hashPasswordWithSalt(password, salt);
  appendObjectRow('Users', {
    User_ID: generateId('USR'),
    Username: username,
    Password_Hash: hash,
    Salt: salt,
    Role: 'Owner',
    Full_Name: fullName,
    Status: 'Active',
    Phone: '',
    Must_Change_Password: false,
    Created_At: nowStr(),
    Last_Login: ''
  }, ['Phone']);
  logActivity(username, 'Owner', 'SETUP_OWNER', 'Users', 'Setup akun Owner awal');
  return { success: true, stage: 'SETUP_CREATED', dbId: DB_ID };
}

function loginUser(payload) {
  const username = String(payload.username || '').trim().toLowerCase();
  const password = String(payload.password || '');

  if (!username || !password) {
    return {
      success: false,
      stage: 'LOGIN_EMPTY_CREDENTIALS',
      error: 'Username dan password wajib diisi.',
      errorType: 'AUTH_ERROR'
    };
  }

  let users;
  try {
    users = readSheetObjects('Users');
  } catch (e) {
    return {
      success: false,
      stage: 'LOGIN_DB_ERROR',
      error: 'Kesalahan koneksi database saat membaca tabel Users: ' + e.message,
      errorType: 'DB_ERROR'
    };
  }

  const userRow = users.find(u => String(u.Username || '').trim().toLowerCase() === username);
  if (!userRow) {
    return {
      success: false,
      stage: 'LOGIN_USER_NOT_FOUND',
      error: 'Username tidak ditemukan. Periksa kembali penulisan username Anda.',
      errorType: 'AUTH_ERROR'
    };
  }

  const status = String(userRow.Status || 'Active').trim();
  if (status.toLowerCase() !== 'active') {
    return {
      success: false,
      stage: 'LOGIN_ACCOUNT_INACTIVE',
      error: 'Akun Anda sedang dinonaktifkan (' + status + '). Silakan hubungi Owner atau Admin.',
      errorType: 'INACTIVE_ACCOUNT'
    };
  }

  const salt = String(userRow.Salt || '');
  const expectedHash = String(userRow.Password_Hash || '');
  const computedHash = hashPasswordWithSalt(password, salt);

  if (!expectedHash || computedHash !== expectedHash) {
    return {
      success: false,
      stage: 'LOGIN_INVALID_PASSWORD',
      error: 'Password yang Anda masukkan salah.',
      errorType: 'AUTH_ERROR'
    };
  }

  const role = String(userRow.Role || 'Kasir').trim();
  const fullName = String(userRow.Full_Name || username).trim();

  // Validasi jadwal shift khusus untuk role Kasir (Owner & Admin tidak dibatasi jadwal shift)
  if (role === 'Kasir') {
    const shiftCheck = checkCashierShiftSchedule(username);
    if (!shiftCheck.allowed) {
      return {
        success: false,
        stage: 'LOGIN_SHIFT_RESTRICTED',
        error: shiftCheck.reason,
        errorType: 'SHIFT_RESTRICTED'
      };
    }
  }

  // Buat sesi baru di tabel Sessions
  const token = Utilities.getUuid() + '-' + Utilities.getUuid().substring(0, 8);
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_TTL_HOURS * 3600 * 1000);
  const createdStr = Utilities.formatDate(now, TZ, 'yyyy-MM-dd HH:mm:ss');
  const expiresStr = Utilities.formatDate(expires, TZ, 'yyyy-MM-dd HH:mm:ss');

  appendObjectRow('Sessions', {
    Token: token,
    Username: username,
    Role: role,
    Full_Name: fullName,
    Created_At: createdStr,
    Expires_At: expiresStr,
    Is_Active: true
  }, ['Token', 'Created_At', 'Expires_At']);

  updateObjectRow('Users', userRow._rowIndex, { Last_Login: createdStr }, ['Last_Login']);
  logActivity(username, role, 'LOGIN', 'Users', 'Login berhasil ke sistem POS');

  return {
    success: true,
    stage: 'LOGIN_SESSION_CREATED',
    dbId: DB_ID,
    token: token,
    user: {
      userId: String(userRow.User_ID || ''),
      username: username,
      role: role,
      fullName: fullName,
      mustChangePassword: userRow.Must_Change_Password === true || String(userRow.Must_Change_Password).toLowerCase() === 'true'
    }
  };
}

function checkCashierShiftSchedule(username) {
  const settings = getSettingsMap();
  const enforceSchedule = String(settings.enforce_shift_schedule || 'false').toLowerCase() === 'true';
  const allShifts = readSheetObjects('Shifts').filter(s =>
    String(s.Username || '').trim().toLowerCase() === username &&
    s.Is_Active !== false &&
    String(s.Is_Active).toLowerCase() !== 'false'
  );

  // Jika belum ada jadwal atau enforce_shift_schedule = false dan jadwal default ALL 00:00-23:59
  if (allShifts.length === 0) {
    return { allowed: true };
  }

  const now = new Date();
  const dayNamesId = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayIdx = Number(Utilities.formatDate(now, TZ, 'u')) % 7; // 0=Minggu .. 6=Sabtu
  const todayId = dayNamesId[dayIdx].toLowerCase();
  const todayEn = dayNamesEn[dayIdx].toLowerCase();
  const currentHm = Utilities.formatDate(now, TZ, 'HH:mm');

  for (let i = 0; i < allShifts.length; i++) {
    const sh = allShifts[i];
    const daysRaw = String(sh.Day_Of_Week || 'ALL').trim().toLowerCase();
    const dayMatch = daysRaw === 'all' || daysRaw === 'setiap hari' ||
      daysRaw.indexOf(todayId) !== -1 || daysRaw.indexOf(todayEn) !== -1;

    if (dayMatch) {
      const startHm = formatTimeHm(sh.Start_Time || '00:00');
      const endHm = formatTimeHm(sh.End_Time || '23:59');
      if (startHm <= endHm) {
        if (currentHm >= startHm && currentHm <= endHm) return { allowed: true };
      } else {
        // Shift lintas tengah malam (misal 20:00 - 04:00)
        if (currentHm >= startHm || currentHm <= endHm) return { allowed: true };
      }
    }
  }

  if (!enforceSchedule) {
    // Jika admin menambahkan jadwal spesifik (bukan 00:00-23:59), tetap periksa kecuali jadwalnya hanya 1 dan ALL 00:00-23:59
    const hasStrictSchedule = allShifts.some(s => formatTimeHm(s.Start_Time) !== '00:00' || formatTimeHm(s.End_Time) !== '23:59');
    if (!hasStrictSchedule) return { allowed: true };
  }

  const scheduleDesc = allShifts.map(s => `${s.Shift_Name || 'Shift'} (${s.Day_Of_Week}: ${formatTimeHm(s.Start_Time)}-${formatTimeHm(s.End_Time)} WIB)`).join(', ');
  return {
    allowed: false,
    reason: `Login Kasir ditolak karena di luar jadwal shift operasional Anda. Waktu sekarang: ${currentHm} WIB. Jadwal Anda: ${scheduleDesc}. Hubungi Admin/Owner jika perlu penyesuaian jadwal.`
  };
}

function formatTimeHm(val) {
  if (!val) return '00:00';
  if (val instanceof Date) {
    return Utilities.formatDate(val, TZ, 'HH:mm');
  }
  const s = String(val).trim();
  const m = s.match(/(\d{1,2}):(\d{2})/);
  if (m) {
    return ('0' + m[1]).slice(-2) + ':' + m[2];
  }
  return '00:00';
}

function parseSessionExpiryMs(rawVal) {
  if (!rawVal) return NaN;
  if (rawVal instanceof Date) {
    return rawVal.getTime();
  }
  const expStr = String(rawVal || '').trim();
  if (!expStr) return NaN;
  const isoMatch = expStr.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})/);
  if (isoMatch) {
    const d = new Date(isoMatch[1] + 'T' + isoMatch[2] + '+07:00');
    if (!isNaN(d.getTime())) return d.getTime();
  }
  const fallback = new Date(expStr);
  return fallback.getTime();
}

function sessionCacheKey_(token) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(token));
  return 'sess_' + digest.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

function validateSessionTokenWithDiag(token) {
  const cleanToken = String(token || '').trim();
  if (!cleanToken) {
    return {
      valid: false,
      stage: 'TOKEN_MISSING_IN_REQUEST',
      message: 'Token sesi tidak ditemukan pada permintaan pemeriksaan sesi.'
    };
  }
  const nowMs = new Date().getTime();

  // Cache validasi sesi singkat (60 dtk) agar tiap request tidak membaca seluruh sheet Sessions + Users.
  // Dibersihkan saat logout; kegagalan cache selalu fallback ke pembacaan sheet.
  const cacheKey = sessionCacheKey_(cleanToken);
  try {
    const hit = CacheService.getScriptCache().get(cacheKey);
    if (hit) {
      const parsed = JSON.parse(hit);
      if (parsed && parsed.user && (isNaN(parsed.expMs) || parsed.expMs === null || nowMs < parsed.expMs)) {
        return { valid: true, stage: 'SESSION_VALIDATED', user: parsed.user };
      }
    }
  } catch (cacheErr) {
    Logger.log('Session cache read skipped: ' + cacheErr.message);
  }

  const sessions = readSheetObjects('Sessions');

  for (let i = sessions.length - 1; i >= 0; i--) {
    const s = sessions[i];
    if (String(s.Token || '').trim() === cleanToken) {
      if (s.Is_Active === false || String(s.Is_Active).toLowerCase() === 'false') {
        return {
          valid: false,
          stage: 'SESSION_INACTIVE',
          message: 'Sesi telah berakhir (logout). Silakan login kembali.'
        };
      }
      const expMs = parseSessionExpiryMs(s.Expires_At);
      if (!isNaN(expMs) && nowMs > expMs) {
        updateObjectRow('Sessions', s._rowIndex, { Is_Active: false });
        return {
          valid: false,
          stage: 'SESSION_EXPIRED',
          message: 'Sesi Anda telah kedaluwarsa. Silakan login kembali.'
        };
      }
      // Pastikan user masih aktif di tabel Users
      const uname = String(s.Username || '').trim().toLowerCase();
      const users = readSheetObjects('Users');
      const uRow = users.find(u => String(u.Username || '').trim().toLowerCase() === uname);
      if (!uRow || String(uRow.Status || 'Active').toLowerCase() !== 'active') {
        return {
          valid: false,
          stage: 'SESSION_USER_INACTIVE',
          message: 'Akun pengguna tidak ditemukan atau sedang dinonaktifkan.'
        };
      }
      const validUser = {
        token: cleanToken,
        userId: String(uRow.User_ID || ''),
        username: uname,
        role: String(uRow.Role || s.Role || 'Kasir').trim(),
        fullName: String(uRow.Full_Name || s.Full_Name || uname).trim(),
        mustChangePassword: uRow.Must_Change_Password === true || String(uRow.Must_Change_Password).toLowerCase() === 'true'
      };
      try {
        CacheService.getScriptCache().put(cacheKey, JSON.stringify({ user: validUser, expMs: isNaN(expMs) ? null : expMs }), 60);
      } catch (cacheErr) {
        Logger.log('Session cache write skipped: ' + cacheErr.message);
      }
      return { valid: true, stage: 'SESSION_VALIDATED', user: validUser };
    }
  }
  return {
    valid: false,
    stage: 'SESSION_NOT_FOUND_IN_DB',
    message: 'Sesi tidak ditemukan di database. Silakan login kembali.'
  };
}

function validateSessionToken(token) {
  const res = validateSessionTokenWithDiag(token);
  return res.valid ? res.user : null;
}

function logoutUser(token, sessionUser) {
  try { CacheService.getScriptCache().remove(sessionCacheKey_(String(token || '').trim())); } catch (cacheErr) { /* abaikan */ }
  const sessions = readSheetObjects('Sessions');
  sessions.forEach(s => {
    if (String(s.Token || '').trim() === token) {
      updateObjectRow('Sessions', s._rowIndex, { Is_Active: false });
    }
  });
  if (sessionUser) {
    logActivity(sessionUser.username, sessionUser.role, 'LOGOUT', 'Sessions', 'Logout dari sistem POS');
  }
  return { success: true };
}

function changeOwnPassword(payload, sessionUser) {
  const oldPassword = String(payload.oldPassword || payload.currentPassword || '');
  const newPassword = String(payload.newPassword || '');

  if (!oldPassword || !newPassword) {
    return { error: 'Password saat ini dan password baru wajib diisi.' };
  }
  if (newPassword.length < 4) {
    return { error: 'Password baru minimal harus terdiri dari 4 karakter.' };
  }

  const users = readSheetObjects('Users');
  const uRow = users.find(u => String(u.Username || '').trim().toLowerCase() === sessionUser.username);
  if (!uRow) return { error: 'Data pengguna tidak ditemukan.' };

  const currentHash = hashPasswordWithSalt(oldPassword, String(uRow.Salt || ''));
  if (currentHash !== String(uRow.Password_Hash || '')) {
    return { error: 'Password saat ini yang Anda masukkan tidak sesuai.' };
  }

  const newSalt = Utilities.getUuid().replace(/-/g, '').substring(0, 16);
  const newHash = hashPasswordWithSalt(newPassword, newSalt);
  updateObjectRow('Users', uRow._rowIndex, {
    Password_Hash: newHash,
    Salt: newSalt,
    Must_Change_Password: false
  });

  logActivity(sessionUser.username, sessionUser.role, 'CHANGE_PASSWORD', sessionUser.username, 'Mengubah password akun pribadi');
  return { success: true, message: 'Password berhasil diperbarui.' };
}

// ============================================================================
// 6. MANAJEMEN KARYAWAN, JADWAL SHIFT & SESI SHIFT KAS LACI
// ============================================================================
function getEmployeesAndShifts() {
  const users = readSheetObjects('Users').map(u => ({
    userId: String(u.User_ID || ''),
    username: String(u.Username || ''),
    fullName: String(u.Full_Name || u.Username || ''),
    role: String(u.Role || 'Kasir'),
    status: String(u.Status || 'Active'),
    phone: String(u.Phone || ''),
    lastLogin: formatTimestampWIB(u.Last_Login)
  }));

  const userMap = {};
  users.forEach(u => { userMap[u.username.toLowerCase()] = u.fullName; });

  const schedules = readSheetObjects('Shifts').map(s => {
    const uname = String(s.Username || '').trim();
    return {
      scheduleId: String(s.Shift_ID || ''),
      shiftId: String(s.Shift_ID || ''),
      username: uname,
      fullName: String(s.Full_Name || userMap[uname.toLowerCase()] || uname),
      shiftName: String(s.Shift_Name || 'Shift Operasional'),
      dayOfWeek: String(s.Day_Of_Week || 'ALL'),
      startTime: formatTimeHm(s.Start_Time),
      endTime: formatTimeHm(s.End_Time),
      isActive: s.Is_Active !== false && String(s.Is_Active).toLowerCase() !== 'false'
    };
  });

  const shiftSessions = readSheetObjects('Shift_Sessions').map(ss => {
    const uname = String(ss.Username || '').trim();
    const openingCash = Number(ss.Opening_Cash) || 0;
    const cashSales = Number(ss.Cash_Sales) || 0;
    const cashRefunds = Number(ss.Cash_Refunds) || 0;
    const cashExpenses = Number(ss.Cash_Expenses) || 0;
    const expectedCash = openingCash + cashSales - cashRefunds - cashExpenses;
    const actualCash = Number(ss.Actual_Cash) || 0;
    const diff = ss.Status === 'CLOSED' ? (actualCash - expectedCash) : 0;

    return {
      sessionId: String(ss.Session_ID || ''),
      username: uname,
      fullName: String(ss.Full_Name || userMap[uname.toLowerCase()] || uname),
      shiftName: String(ss.Shift_Name || 'Shift Operasional'),
      startTime: formatTimestampWIB(ss.Open_Time),
      openTime: formatTimestampWIB(ss.Open_Time),
      endTime: formatTimestampWIB(ss.Close_Time),
      closeTime: formatTimestampWIB(ss.Close_Time),
      openingCash: openingCash,
      cashSalesTotal: cashSales,
      cashRefundsTotal: cashRefunds,
      cashRefundTotal: cashRefunds,
      cashExpensesTotal: cashExpenses,
      cashOutExpenses: cashExpenses,
      expectedCash: expectedCash,
      actualCash: actualCash,
      difference: diff,
      status: String(ss.Status || 'OPEN'),
      notes: String(ss.Notes || '')
    };
  }).reverse();

  return {
    success: true,
    employees: users,
    schedules: schedules,
    shiftSessions: shiftSessions
  };
}

function saveEmployee(payload, sessionUser) {
  const emp = payload.employee || payload;
  const userId = String(emp.userId || emp.id || '').trim();
  const username = String(emp.username || '').trim().toLowerCase();
  const fullName = String(emp.fullName || emp.name || '').trim();
  const role = String(emp.role || 'Kasir').trim();
  const phone = String(emp.phone || '').trim();
  const status = String(emp.status || 'Active').trim();
  const password = String(emp.password || '');

  if (!username || !fullName) {
    return { error: 'Nama lengkap dan username wajib diisi.' };
  }
  if (['Owner', 'Admin', 'Kasir'].indexOf(role) === -1) {
    return { error: 'Role tidak valid. Pilih Owner, Admin, atau Kasir.' };
  }
  if (role === 'Owner' && sessionUser.role !== 'Owner') {
    return { error: 'Hanya Owner yang dapat membuat atau mengubah akun dengan role Owner.' };
  }

  const users = readSheetObjects('Users');
  const duplicate = users.find(u =>
    String(u.Username || '').trim().toLowerCase() === username &&
    String(u.User_ID || '') !== userId
  );
  if (duplicate) {
    return { error: `Username @${username} sudah digunakan oleh akun lain.` };
  }

  if (userId) {
    const target = users.find(u => String(u.User_ID || '') === userId);
    if (!target) return { error: 'Akun karyawan tidak ditemukan.' };
    const updates = {
      Username: username,
      Full_Name: fullName,
      Role: role,
      Phone: phone,
      Status: status
    };
    if (password) {
      if (password.length < 4) return { error: 'Password minimal 4 karakter.' };
      const salt = Utilities.getUuid().replace(/-/g, '').substring(0, 16);
      updates.Salt = salt;
      updates.Password_Hash = hashPasswordWithSalt(password, salt);
    }
    updateObjectRow('Users', target._rowIndex, updates, ['Phone']);
    logActivity(sessionUser.username, sessionUser.role, 'UPDATE_USER', username, `Role: ${role}, Status: ${status}`);
    return { success: true, userId: userId };
  } else {
    if (!password || password.length < 4) {
      return { error: 'Password awal wajib diisi (minimal 4 karakter) untuk akun baru.' };
    }
    const newId = generateId('USR');
    const salt = Utilities.getUuid().replace(/-/g, '').substring(0, 16);
    const hash = hashPasswordWithSalt(password, salt);
    appendObjectRow('Users', {
      User_ID: newId,
      Username: username,
      Password_Hash: hash,
      Salt: salt,
      Role: role,
      Full_Name: fullName,
      Status: status,
      Phone: phone,
      Must_Change_Password: false,
      Created_At: nowStr(),
      Last_Login: ''
    }, ['Phone']);
    logActivity(sessionUser.username, sessionUser.role, 'CREATE_USER', username, `Role: ${role}`);
    return { success: true, userId: newId };
  }
}

function resetEmployeePassword(payload, sessionUser) {
  const userId = String(payload.userId || '').trim();
  const username = String(payload.username || '').trim().toLowerCase();
  const newPassword = String(payload.newPassword || '').trim();

  if (!newPassword || newPassword.length < 4) {
    return { error: 'Password baru minimal 4 karakter.' };
  }

  const users = readSheetObjects('Users');
  const target = users.find(u =>
    (userId && String(u.User_ID || '') === userId) ||
    (username && String(u.Username || '').trim().toLowerCase() === username)
  );
  if (!target) return { error: 'Akun pengguna tidak ditemukan.' };
  if (String(target.Role) === 'Owner' && sessionUser.role !== 'Owner') {
    return { error: 'Hanya Owner yang dapat mereset password akun Owner.' };
  }

  const salt = Utilities.getUuid().replace(/-/g, '').substring(0, 16);
  const hash = hashPasswordWithSalt(newPassword, salt);
  updateObjectRow('Users', target._rowIndex, {
    Password_Hash: hash,
    Salt: salt
  });

  logActivity(sessionUser.username, sessionUser.role, 'RESET_PASSWORD', target.Username, 'Reset password oleh ' + sessionUser.username);
  return { success: true };
}

function deleteEmployee(payload, sessionUser) {
  const userId = String(payload.userId || '').trim();
  const username = String(payload.username || '').trim().toLowerCase();

  const users = readSheetObjects('Users');
  const target = users.find(u =>
    (userId && String(u.User_ID || '') === userId) ||
    (username && String(u.Username || '').trim().toLowerCase() === username)
  );
  if (!target) return { error: 'Akun pengguna tidak ditemukan.' };
  if (String(target.Username || '').toLowerCase() === sessionUser.username) {
    return { error: 'Anda tidak dapat menonaktifkan akun Anda sendiri yang sedang aktif.' };
  }
  if (String(target.Role) === 'Owner' && sessionUser.role !== 'Owner') {
    return { error: 'Admin tidak dapat menonaktifkan akun Owner.' };
  }

  const nextStatus = String(target.Status) === 'Active' ? 'Inactive' : 'Active';
  updateObjectRow('Users', target._rowIndex, { Status: nextStatus });
  logActivity(sessionUser.username, sessionUser.role, 'TOGGLE_USER_STATUS', target.Username, 'Status menjadi ' + nextStatus);
  return { success: true, newStatus: nextStatus };
}

function saveShiftSchedule(payload, sessionUser) {
  const sch = payload.schedule || payload;
  const scheduleId = String(sch.scheduleId || sch.shiftId || '').trim();
  const username = String(sch.username || '').trim().toLowerCase();
  const fullName = String(sch.fullName || username).trim();
  const shiftName = String(sch.shiftName || 'Shift Operasional').trim();
  const dayOfWeek = String(sch.dayOfWeek || 'ALL').trim();
  const startTime = formatTimeHm(sch.startTime || '07:00');
  const endTime = formatTimeHm(sch.endTime || '15:00');
  const isActive = sch.isActive !== false;

  if (!username) return { error: 'Pilih karyawan terlebih dahulu.' };

  if (scheduleId) {
    const list = readSheetObjects('Shifts');
    const target = list.find(s => String(s.Shift_ID || '') === scheduleId);
    if (target) {
      updateObjectRow('Shifts', target._rowIndex, {
        Username: username,
        Full_Name: fullName,
        Shift_Name: shiftName,
        Day_Of_Week: dayOfWeek,
        Start_Time: startTime,
        End_Time: endTime,
        Is_Active: isActive
      });
      return { success: true, scheduleId: scheduleId };
    }
  }

  const newId = generateId('SHF');
  appendObjectRow('Shifts', {
    Shift_ID: newId,
    Username: username,
    Full_Name: fullName,
    Shift_Name: shiftName,
    Day_Of_Week: dayOfWeek,
    Start_Time: startTime,
    End_Time: endTime,
    Is_Active: isActive
  });
  logActivity(sessionUser.username, sessionUser.role, 'SAVE_SHIFT_SCHEDULE', username, `${shiftName}: ${dayOfWeek} ${startTime}-${endTime}`);
  return { success: true, scheduleId: newId };
}

function deleteShiftSchedule(payload, sessionUser) {
  const id = String(payload.scheduleId || payload.shiftId || payload.id || '').trim();
  if (!id) return { error: 'ID jadwal shift wajib diisi.' };
  const ss = getDB();
  const sheet = ss.getSheetByName('Shifts');
  const list = readSheetObjects('Shifts');
  const target = list.find(s => String(s.Shift_ID || '') === id);
  if (!target) return { error: 'Jadwal shift tidak ditemukan.' };
  sheet.deleteRow(target._rowIndex);
  logActivity(sessionUser.username, sessionUser.role, 'DELETE_SHIFT_SCHEDULE', id, 'Menghapus jadwal shift');
  return { success: true };
}

// ============================================================================
// 7. FITUR BUKA SHIFT, MODAL AWAL KAS & REKONSILIASI LACI KASIR
// ============================================================================
function getActiveShiftSession(sessionUser) {
  const sessions = readSheetObjects('Shift_Sessions');
  // Cari shift OPEN milik kasir ini (atau jika belum ada, shift OPEN di toko)
  let openRow = sessions.find(s =>
    String(s.Status || '').toUpperCase() === 'OPEN' &&
    String(s.Username || '').trim().toLowerCase() === sessionUser.username
  );
  if (!openRow) {
    openRow = sessions.find(s => String(s.Status || '').toUpperCase() === 'OPEN');
  }
  if (!openRow) {
    return { success: true, activeShift: null };
  }

  const openingCash = Number(openRow.Opening_Cash) || 0;
  const cashSales = Number(openRow.Cash_Sales) || 0;
  const cashRefunds = Number(openRow.Cash_Refunds) || 0;
  const cashExpenses = Number(openRow.Cash_Expenses) || 0;
  const expectedCash = openingCash + cashSales - cashRefunds - cashExpenses;

  // Ambil daftar log kas selama sesi ini
  const cashLogs = readSheetObjects('Cash_Management')
    .filter(c => String(c.Session_ID || '') === String(openRow.Session_ID || ''))
    .map(c => ({
      logId: String(c.Cash_Log_ID || ''),
      timestamp: formatTimestampWIB(c.Timestamp),
      type: String(c.Type || ''),
      amount: Number(c.Amount) || 0,
      referenceId: String(c.Reference_ID || ''),
      notes: String(c.Notes || '')
    }));

  return {
    success: true,
    activeShift: {
      sessionId: String(openRow.Session_ID || ''),
      username: String(openRow.Username || ''),
      fullName: String(openRow.Full_Name || openRow.Username || ''),
      shiftName: String(openRow.Shift_Name || 'Shift Operasional'),
      startTime: formatTimestampWIB(openRow.Open_Time),
      openingCash: openingCash,
      cashSalesTotal: cashSales,
      cashRefundsTotal: cashRefunds,
      cashExpensesTotal: cashExpenses,
      expectedCash: expectedCash,
      status: 'OPEN',
      notes: String(openRow.Notes || ''),
      cashLogs: cashLogs
    }
  };
}

function openShiftSession(payload, sessionUser) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return { error: 'Sistem sedang memproses permintaan shift lain. Silakan coba beberapa saat lagi.' };
  }

  try {
    const rawCash = payload.openingCash;
    if (rawCash === undefined || rawCash === null || String(rawCash).trim() === '') {
      return { error: 'Nominal modal awal kas wajib diisi (tidak boleh kosong).' };
    }
    const openingCash = Number(rawCash);
    if (isNaN(openingCash) || openingCash < 0) {
      return { error: 'Nominal modal awal kas tidak valid dan tidak boleh bernilai negatif.' };
    }

    const shiftName = String(payload.shiftName || 'Shift Operasional').trim();
    const notes = String(payload.notes || '').trim();

    // Cek apakah sudah ada shift aktif untuk kasir ini / toko ini
    const sessions = readSheetObjects('Shift_Sessions');
    const existingOpen = sessions.find(s =>
      String(s.Status || '').toUpperCase() === 'OPEN' &&
      String(s.Username || '').trim().toLowerCase() === sessionUser.username
    );
    if (existingOpen) {
      return {
        error: `Anda masih memiliki sesi shift yang aktif (${existingOpen.Session_ID} dibuka pada ${formatTimestampWIB(existingOpen.Open_Time)}). Tutup shift tersebut terlebih dahulu sebelum membuka shift baru.`
      };
    }

    const sessionId = generateId('SES');
    const now = nowStr();

    appendObjectRow('Shift_Sessions', {
      Session_ID: sessionId,
      Username: sessionUser.username,
      Full_Name: sessionUser.fullName,
      Shift_Name: shiftName,
      Open_Time: now,
      Close_Time: '',
      Opening_Cash: openingCash,
      Cash_Sales: 0,
      Cash_Refunds: 0,
      Cash_Expenses: 0,
      Expected_Cash: openingCash,
      Actual_Cash: 0,
      Difference: 0,
      Status: 'OPEN',
      Notes: notes
    });

    appendObjectRow('Cash_Management', {
      Cash_Log_ID: generateId('CSH'),
      Timestamp: now,
      Session_ID: sessionId,
      Username: sessionUser.username,
      Type: 'OPENING_CASH',
      Amount: openingCash,
      Reference_ID: sessionId,
      Notes: notes || 'Modal awal buka shift (' + shiftName + ')'
    });

    logActivity(sessionUser.username, sessionUser.role, 'OPEN_SHIFT', sessionId, `Modal awal: Rp ${openingCash}`);

    return {
      success: true,
      sessionId: sessionId,
      activeShift: {
        sessionId: sessionId,
        username: sessionUser.username,
        fullName: sessionUser.fullName,
        shiftName: shiftName,
        startTime: now,
        openingCash: openingCash,
        cashSalesTotal: 0,
        cashRefundsTotal: 0,
        cashExpensesTotal: 0,
        expectedCash: openingCash,
        status: 'OPEN',
        notes: notes
      }
    };
  } finally {
    lock.releaseLock();
  }
}

function recordCashExpense(payload, sessionUser) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return { error: 'Sistem sibuk. Silakan coba lagi.' };
  }

  try {
    const amount = Number(payload.amount);
    const reason = String(payload.reason || payload.notes || '').trim();
    if (isNaN(amount) || amount <= 0) {
      return { error: 'Nominal pengeluaran kas harus lebih besar dari Rp 0.' };
    }
    if (!reason) {
      return { error: 'Alasan pengeluaran kas wajib diisi untuk audit laci.' };
    }

    const sessions = readSheetObjects('Shift_Sessions');
    let openRow = sessions.find(s =>
      String(s.Status || '').toUpperCase() === 'OPEN' &&
      String(s.Username || '').trim().toLowerCase() === sessionUser.username
    );
    if (!openRow) {
      openRow = sessions.find(s => String(s.Status || '').toUpperCase() === 'OPEN');
    }
    if (!openRow) {
      return { error: 'Tidak ada sesi shift yang sedang aktif. Buka shift terlebih dahulu.' };
    }

    const prevExpenses = Number(openRow.Cash_Expenses) || 0;
    const newExpenses = prevExpenses + amount;
    const openingCash = Number(openRow.Opening_Cash) || 0;
    const cashSales = Number(openRow.Cash_Sales) || 0;
    const cashRefunds = Number(openRow.Cash_Refunds) || 0;
    const expectedCash = openingCash + cashSales - cashRefunds - newExpenses;
    const noteAppend = (openRow.Notes ? openRow.Notes + ' | ' : '') + `[Kas Keluar Rp ${amount}: ${reason}]`;

    updateObjectRow('Shift_Sessions', openRow._rowIndex, {
      Cash_Expenses: newExpenses,
      Expected_Cash: expectedCash,
      Notes: noteAppend
    });

    appendObjectRow('Cash_Management', {
      Cash_Log_ID: generateId('CSH'),
      Timestamp: nowStr(),
      Session_ID: openRow.Session_ID,
      Username: sessionUser.username,
      Type: 'CASH_OUT_EXPENSE',
      Amount: -amount,
      Reference_ID: openRow.Session_ID,
      Notes: reason
    });

    logActivity(sessionUser.username, sessionUser.role, 'CASH_EXPENSE', openRow.Session_ID, `Rp ${amount} - ${reason}`);
    return { success: true, expectedCash: expectedCash, cashExpensesTotal: newExpenses };
  } finally {
    lock.releaseLock();
  }
}

function closeShiftSession(payload, sessionUser) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return { error: 'Sistem sibuk. Silakan coba lagi.' };
  }

  try {
    const rawActual = payload.actualCash;
    if (rawActual === undefined || rawActual === null || String(rawActual).trim() === '') {
      return { error: 'Nominal uang tunai aktual di laci wajib diisi.' };
    }
    const actualCash = Number(rawActual);
    if (isNaN(actualCash) || actualCash < 0) {
      return { error: 'Nominal uang tunai aktual tidak boleh bernilai negatif.' };
    }

    const sessionId = String(payload.sessionId || '').trim();
    const notes = String(payload.notes || '').trim();

    const sessions = readSheetObjects('Shift_Sessions');
    let openRow = sessions.find(s =>
      String(s.Status || '').toUpperCase() === 'OPEN' &&
      (!sessionId || String(s.Session_ID || '') === sessionId)
    );
    if (!openRow) {
      return { error: 'Sesi shift aktif tidak ditemukan atau sudah ditutup sebelumnya.' };
    }

    const openingCash = Number(openRow.Opening_Cash) || 0;
    const cashSales = Number(openRow.Cash_Sales) || 0;
    const cashRefunds = Number(openRow.Cash_Refunds) || 0;
    const cashExpenses = Number(openRow.Cash_Expenses) || 0;
    const expectedCash = openingCash + cashSales - cashRefunds - cashExpenses;
    const difference = actualCash - expectedCash;
    const closeTime = nowStr();
    const finalNotes = [openRow.Notes, notes ? `Tutup Shift: ${notes}` : ''].filter(Boolean).join(' | ');

    updateObjectRow('Shift_Sessions', openRow._rowIndex, {
      Close_Time: closeTime,
      Expected_Cash: expectedCash,
      Actual_Cash: actualCash,
      Difference: difference,
      Status: 'CLOSED',
      Notes: finalNotes
    });

    appendObjectRow('Cash_Management', {
      Cash_Log_ID: generateId('CSH'),
      Timestamp: closeTime,
      Session_ID: openRow.Session_ID,
      Username: sessionUser.username,
      Type: 'CLOSING_RECONCILIATION',
      Amount: actualCash,
      Reference_ID: openRow.Session_ID,
      Notes: `Diharapkan: Rp ${expectedCash}, Aktual: Rp ${actualCash}, Selisih: Rp ${difference}`
    });

    logActivity(sessionUser.username, sessionUser.role, 'CLOSE_SHIFT', openRow.Session_ID, `Expected: ${expectedCash}, Actual: ${actualCash}, Diff: ${difference}`);

    return {
      success: true,
      summary: {
        sessionId: openRow.Session_ID,
        openingCash: openingCash,
        cashSales: cashSales,
        cashRefunds: cashRefunds,
        cashExpenses: cashExpenses,
        expectedCash: expectedCash,
        actualCash: actualCash,
        difference: difference,
        closeTime: closeTime
      }
    };
  } finally {
    lock.releaseLock();
  }
}

// ============================================================================
// 8. PRODUK, KATEGORI, BAHAN BAKU (MATERIALS) & KONVERSI UNIT BOM
// ============================================================================
function convertUnitQty(qty, fromUnit, toUnit) {
  const q = Number(qty) || 0;
  const u1 = String(fromUnit || '').trim().toLowerCase();
  const u2 = String(toUnit || '').trim().toLowerCase();
  if (!u1 || !u2 || u1 === u2) return q;

  // Konversi Berat: kg <-> gram
  if ((u1 === 'kg' || u1 === 'kilogram') && (u2 === 'gram' || u2 === 'g' || u2 === 'gr')) return q * 1000;
  if ((u1 === 'gram' || u1 === 'g' || u1 === 'gr') && (u2 === 'kg' || u2 === 'kilogram')) return q / 1000;

  // Konversi Volume: liter <-> ml
  if ((u1 === 'liter' || u1 === 'l' || u1 === 'lt') && (u2 === 'ml' || u2 === 'mililiter')) return q * 1000;
  if ((u1 === 'ml' || u1 === 'mililiter') && (u2 === 'liter' || u2 === 'l' || u2 === 'lt')) return q / 1000;

  return q;
}

function getCategoriesList(includeInactive) {
  const rows = readSheetObjects('Categories');
  return rows.map(r => ({
    categoryId: String(r.Category_ID || ''),
    id: String(r.Category_ID || ''),
    name: String(r.Name || '').trim(),
    description: String(r.Description || ''),
    sortOrder: Number(r.Sort_Order) || 1,
    colorTheme: String(r.Color_Theme || 'blue'),
    isActive: r.Is_Active !== false && String(r.Is_Active).toLowerCase() !== 'false'
  })).filter(c => includeInactive ? true : c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function saveCategory(payload, sessionUser) {
  const cat = payload.category || payload;
  const id = String(cat.categoryId || cat.id || '').trim();
  const name = String(cat.name || '').trim();
  const description = String(cat.description || '').trim();
  const sortOrder = Number(cat.sortOrder) || 1;
  const colorTheme = String(cat.colorTheme || 'blue').trim();
  const isActive = cat.isActive !== false;

  if (!name) return { error: 'Nama kategori wajib diisi.' };

  const rows = readSheetObjects('Categories');
  const dup = rows.find(r =>
    String(r.Name || '').trim().toLowerCase() === name.toLowerCase() &&
    String(r.Category_ID || '') !== id
  );
  if (dup) return { error: `Kategori "${name}" sudah terdaftar.` };

  if (id) {
    const target = rows.find(r => String(r.Category_ID || '') === id);
    if (!target) return { error: 'Kategori tidak ditemukan.' };
    updateObjectRow('Categories', target._rowIndex, {
      Name: name,
      Description: description,
      Sort_Order: sortOrder,
      Color_Theme: colorTheme,
      Is_Active: isActive
    });
    return { success: true, categoryId: id };
  } else {
    const newId = generateId('CAT');
    appendObjectRow('Categories', {
      Category_ID: newId,
      Name: name,
      Description: description,
      Sort_Order: sortOrder,
      Color_Theme: colorTheme,
      Is_Active: isActive
    });
    logActivity(sessionUser.username, sessionUser.role, 'CREATE_CATEGORY', newId, name);
    return { success: true, categoryId: newId };
  }
}

function deleteCategory(payload, sessionUser) {
  const id = String(payload.categoryId || payload.id || '').trim();
  if (!id) return { error: 'ID kategori wajib diisi.' };
  const ss = getDB();
  const sheet = ss.getSheetByName('Categories');
  const rows = readSheetObjects('Categories');
  const target = rows.find(r => String(r.Category_ID || '') === id);
  if (!target) return { error: 'Kategori tidak ditemukan.' };
  sheet.deleteRow(target._rowIndex);
  logActivity(sessionUser.username, sessionUser.role, 'DELETE_CATEGORY', id, target.Name);
  return { success: true };
}

function getMaterialsList(includeInactive) {
  const rows = readSheetObjects('Materials');
  return rows.map(r => {
    const stock = Number(r.Stock) || 0;
    const minStock = Number(r.Min_Stock) || 0;
    const costPerUnit = Number(r.Cost_Per_Unit) || 0;
    const isActive = r.Is_Active !== false && String(r.Is_Active).toLowerCase() !== 'false';
    return {
      materialId: String(r.Material_ID || ''),
      id: String(r.Material_ID || ''),
      sku: String(r.SKU || ''),
      name: String(r.Name || '').trim(),
      unit: String(r.Unit || 'gram').trim(),
      stock: Number(stock.toFixed(2)),
      minStock: Number(minStock.toFixed(2)),
      costPerUnit: costPerUnit,
      cost: costPerUnit,
      supplier: String(r.Supplier || ''),
      isLowStock: stock <= minStock,
      isActive: isActive,
      updatedAt: formatTimestampWIB(r.Updated_At)
    };
  }).filter(m => includeInactive ? true : m.isActive);
}

/**
 * Menyimpan Bahan Baku (Tambah / Edit) dengan dukungan penuh baik payload flat maupun nested.
 */
function saveMaterial(payload, sessionUser) {
  const m = (payload && payload.material && typeof payload.material === 'object') ? payload.material : payload;
  const id = String(m.materialId || m.id || '').trim();
  const name = String(m.name || m.materialName || '').trim();
  const sku = String(m.sku || m.code || '').trim();
  const unit = String(m.unit || 'gram').trim();
  const rawStock = m.stock !== undefined && m.stock !== '' ? Number(m.stock) : 0;
  const rawMinStock = m.minStock !== undefined && m.minStock !== '' ? Number(m.minStock) : 0;
  const rawCost = m.costPerUnit !== undefined ? Number(m.costPerUnit) : (m.cost !== undefined ? Number(m.cost) : 0);
  const supplier = String(m.supplier || '').trim();
  const isActive = m.isActive !== false && String(m.isActive).toLowerCase() !== 'false';

  if (!name) {
    return { error: 'Nama bahan baku wajib diisi.' };
  }
  if (!unit) {
    return { error: 'Satuan dasar bahan baku wajib dipilih.' };
  }
  if (isNaN(rawStock) || rawStock < 0) {
    return { error: 'Stok bahan baku tidak boleh bernilai negatif.' };
  }
  if (isNaN(rawMinStock) || rawMinStock < 0) {
    return { error: 'Stok minimum bahan baku tidak boleh bernilai negatif.' };
  }
  if (isNaN(rawCost) || rawCost < 0) {
    return { error: 'Biaya per satuan dasar tidak boleh bernilai negatif.' };
  }

  const rows = readSheetObjects('Materials');
  const dup = rows.find(r =>
    String(r.Name || '').trim().toLowerCase() === name.toLowerCase() &&
    String(r.Material_ID || '') !== id &&
    (r.Is_Active !== false && String(r.Is_Active).toLowerCase() !== 'false')
  );
  if (dup) {
    return { error: `Bahan baku dengan nama "${name}" sudah terdaftar (${dup.Material_ID}). Gunakan fitur Edit untuk memperbarui data.` };
  }

  const now = nowStr();
  if (id) {
    const target = rows.find(r => String(r.Material_ID || '') === id);
    if (!target) return { error: 'Data bahan baku tidak ditemukan untuk diedit.' };

    const prevStock = Number(target.Stock) || 0;
    updateObjectRow('Materials', target._rowIndex, {
      SKU: sku || target.SKU || ('ING-' + id.slice(-4)),
      Name: name,
      Unit: unit,
      Stock: rawStock,
      Min_Stock: rawMinStock,
      Cost_Per_Unit: rawCost,
      Supplier: supplier,
      Is_Active: isActive,
      Updated_At: now
    });

    if (Math.abs(rawStock - prevStock) > 0.0001) {
      appendObjectRow('Stock_Movements', {
        Movement_ID: generateId('MOV'),
        Timestamp: now,
        Item_Type: 'MATERIAL',
        Item_ID: id,
        Item_Name: name,
        Type: 'EDIT_ADJUSTMENT',
        Qty: Number((rawStock - prevStock).toFixed(2)),
        Unit: unit,
        Prev_Stock: prevStock,
        New_Stock: rawStock,
        Unit_Cost: rawCost,
        Reference_ID: id,
        Notes: 'Perubahan stok melalui form edit bahan baku',
        Actor: sessionUser.username
      });
    }

    logActivity(sessionUser.username, sessionUser.role, 'UPDATE_MATERIAL', id, `${name} (${rawStock} ${unit})`);
    return {
      success: true,
      materialId: id,
      material: {
        materialId: id, sku: sku, name: name, unit: unit,
        stock: rawStock, minStock: rawMinStock, costPerUnit: rawCost, supplier: supplier, isActive: isActive
      }
    };
  } else {
    const newId = generateId('MAT');
    const finalSku = sku || ('ING-' + Math.floor(1000 + Math.random() * 9000));
    appendObjectRow('Materials', {
      Material_ID: newId,
      SKU: finalSku,
      Name: name,
      Unit: unit,
      Stock: rawStock,
      Min_Stock: rawMinStock,
      Cost_Per_Unit: rawCost,
      Supplier: supplier,
      Is_Active: true,
      Updated_At: now
    });

    appendObjectRow('Stock_Movements', {
      Movement_ID: generateId('MOV'),
      Timestamp: now,
      Item_Type: 'MATERIAL',
      Item_ID: newId,
      Item_Name: name,
      Type: 'INITIAL_STOCK',
      Qty: rawStock,
      Unit: unit,
      Prev_Stock: 0,
      New_Stock: rawStock,
      Unit_Cost: rawCost,
      Reference_ID: newId,
      Notes: 'Stok awal pendaftaran bahan baku baru',
      Actor: sessionUser.username
    });

    logActivity(sessionUser.username, sessionUser.role, 'CREATE_MATERIAL', newId, `${name} (${rawStock} ${unit})`);
    return {
      success: true,
      materialId: newId,
      material: {
        materialId: newId, sku: finalSku, name: name, unit: unit,
        stock: rawStock, minStock: rawMinStock, costPerUnit: rawCost, supplier: supplier, isActive: true
      }
    };
  }
}

function deleteMaterial(payload, sessionUser) {
  const id = String(payload.materialId || payload.id || '').trim();
  if (!id) return { error: 'ID bahan baku wajib diisi.' };

  const ss = getDB();
  const sheet = ss.getSheetByName('Materials');
  const rows = readSheetObjects('Materials');
  const target = rows.find(r => String(r.Material_ID || '') === id);
  if (!target) return { error: 'Bahan baku tidak ditemukan.' };

  // Cek apakah bahan baku digunakan dalam BOM produk aktif
  const boms = readSheetObjects('BOM').filter(b => String(b.Material_ID || '') === id);
  if (boms.length > 0 && payload.forceDelete !== true) {
    // Nonaktifkan secara aman atau hapus baris BOM terkait jika diminta
    sheet.deleteRow(target._rowIndex);
    const bomSheet = ss.getSheetByName('BOM');
    for (let i = boms.length - 1; i >= 0; i--) {
      bomSheet.deleteRow(boms[i]._rowIndex);
    }
  } else {
    sheet.deleteRow(target._rowIndex);
  }

  logActivity(sessionUser.username, sessionUser.role, 'DELETE_MATERIAL', id, target.Name);
  return { success: true };
}

function adjustMaterialStock(payload, sessionUser) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return { error: 'Sistem sedang memproses transaksi stok lain. Silakan coba lagi.' };
  }

  try {
    const id = String(payload.materialId || payload.id || '').trim();
    const mode = String(payload.mode || payload.type || 'IN').toUpperCase();
    const inputQty = Number(payload.qty);
    const inputUnit = String(payload.inputUnit || payload.unit || '').trim();
    const newCostRaw = payload.newCostPerUnit !== undefined && payload.newCostPerUnit !== '' ? Number(payload.newCostPerUnit) : null;
    const notes = String(payload.notes || '').trim();

    if (!id) return { error: 'ID bahan baku wajib diisi.' };
    if (isNaN(inputQty) || inputQty < 0 || (mode !== 'OPNAME' && inputQty <= 0)) {
      return { error: 'Jumlah mutasi stok harus berupa angka positif.' };
    }

    const rows = readSheetObjects('Materials');
    const target = rows.find(r => String(r.Material_ID || '') === id);
    if (!target) return { error: 'Bahan baku tidak ditemukan.' };

    const baseUnit = String(target.Unit || 'gram').trim();
    const convertedQty = convertUnitQty(inputQty, inputUnit || baseUnit, baseUnit);
    const prevStock = Number(target.Stock) || 0;
    let newStock = prevStock;
    let delta = 0;

    if (mode === 'IN' || mode === 'RESTOCK') {
      newStock = prevStock + convertedQty;
      delta = convertedQty;
    } else if (mode === 'OUT' || mode === 'WASTE') {
      if (prevStock < convertedQty) {
        return { error: `Stok bahan ${target.Name} tidak mencukupi (Tersedia: ${prevStock} ${baseUnit}, Diminta: ${convertedQty} ${baseUnit}).` };
      }
      newStock = prevStock - convertedQty;
      delta = -convertedQty;
    } else if (mode === 'OPNAME' || mode === 'ADJUST') {
      newStock = Math.max(0, convertedQty);
      delta = newStock - prevStock;
    } else {
      return { error: 'Tipe mutasi tidak valid.' };
    }

    newStock = Number(newStock.toFixed(2));
    const finalCost = (newCostRaw !== null && !isNaN(newCostRaw) && newCostRaw >= 0) ? newCostRaw : (Number(target.Cost_Per_Unit) || 0);
    const now = nowStr();

    updateObjectRow('Materials', target._rowIndex, {
      Stock: newStock,
      Cost_Per_Unit: finalCost,
      Updated_At: now
    });

    appendObjectRow('Stock_Movements', {
      Movement_ID: generateId('MOV'),
      Timestamp: now,
      Item_Type: 'MATERIAL',
      Item_ID: id,
      Item_Name: target.Name,
      Type: mode === 'IN' ? 'RESTOCK_IN' : (mode === 'OUT' ? 'WASTE_OUT' : 'STOCK_OPNAME'),
      Qty: Number(delta.toFixed(2)),
      Unit: baseUnit,
      Prev_Stock: prevStock,
      New_Stock: newStock,
      Unit_Cost: finalCost,
      Reference_ID: 'ADJ-MAT',
      Notes: notes || `Mutasi ${mode} (${inputQty} ${inputUnit || baseUnit})`,
      Actor: sessionUser.username
    });

    logActivity(sessionUser.username, sessionUser.role, 'ADJUST_MATERIAL_STOCK', id, `${target.Name}: ${prevStock} -> ${newStock} ${baseUnit}`);
    return {
      success: true,
      materialId: id,
      prevStock: prevStock,
      newStock: newStock,
      baseUnit: baseUnit
    };
  } finally {
    lock.releaseLock();
  }
}

function getBOMData(filterProductId) {
  const materials = getMaterialsList(true);
  const matMap = {};
  materials.forEach(m => { matMap[m.materialId] = m; });

  const rows = readSheetObjects('BOM');
  const list = rows.map(r => {
    const matId = String(r.Material_ID || '');
    const mat = matMap[matId];
    const qtyUsed = Number(r.Qty) || 0;
    const recipeUnit = String(r.Unit || (mat ? mat.unit : 'gram')).trim();
    const baseUnit = mat ? mat.unit : recipeUnit;
    const qtyInBaseUnit = convertUnitQty(qtyUsed, recipeUnit, baseUnit);
    const wastePct = Number(r.Waste_Pct) || 0;
    const effectiveBaseQty = qtyInBaseUnit * (1 + wastePct / 100);
    const lineCost = mat ? Math.round(effectiveBaseQty * mat.costPerUnit) : 0;

    return {
      bomId: String(r.BOM_ID || ''),
      productId: String(r.Product_ID || ''),
      materialId: matId,
      materialName: mat ? mat.name : matId,
      qty: qtyUsed,
      qtyUsed: qtyUsed,
      unit: recipeUnit,
      baseUnit: baseUnit,
      qtyInBaseUnit: Number(qtyInBaseUnit.toFixed(3)),
      wastePct: wastePct,
      wastePercent: wastePct,
      lineCost: lineCost
    };
  }).filter(b => filterProductId ? b.productId === filterProductId : true);

  return { success: true, bom: list };
}

function saveProductBOM(payload, sessionUser) {
  const productId = String(payload.productId || '').trim();
  const recipes = Array.isArray(payload.recipes) ? payload.recipes : (Array.isArray(payload.items) ? payload.items : []);
  if (!productId) return { error: 'ID Produk wajib dipilih.' };

  const ss = getDB();
  const bomSheet = ss.getSheetByName('BOM');
  const existingRows = readSheetObjects('BOM').filter(b => String(b.Product_ID || '') === productId);

  // Hapus baris BOM lama untuk produk ini dari bawah ke atas
  for (let i = existingRows.length - 1; i >= 0; i--) {
    bomSheet.deleteRow(existingRows[i]._rowIndex);
  }

  const materials = getMaterialsList(true);
  const matMap = {};
  materials.forEach(m => { matMap[m.materialId] = m; });

  let calculatedCogs = 0;
  const now = nowStr();

  recipes.forEach(r => {
    const matId = String(r.materialId || '').trim();
    const qty = Number(r.qtyUsed !== undefined ? r.qtyUsed : r.qty) || 0;
    if (!matId || qty <= 0) return;

    const mat = matMap[matId];
    const unit = String(r.unit || (mat ? mat.unit : 'gram')).trim();
    const wastePct = Number(r.wastePercent !== undefined ? r.wastePercent : r.wastePct) || 0;

    appendObjectRow('BOM', {
      BOM_ID: generateId('BOM'),
      Product_ID: productId,
      Material_ID: matId,
      Qty: qty,
      Unit: unit,
      Waste_Pct: wastePct,
      Updated_At: now
    });

    if (mat) {
      const baseQty = convertUnitQty(qty, unit, mat.unit) * (1 + wastePct / 100);
      calculatedCogs += baseQty * mat.costPerUnit;
    }
  });

  calculatedCogs = Math.round(calculatedCogs);

  // Perbarui Cost dan Use_BOM pada produk terkait
  const prodRows = readSheetObjects('Products');
  const prodTarget = prodRows.find(p => String(p.Product_ID || '') === productId);
  if (prodTarget) {
    const updates = { Updated_At: now };
    if (recipes.length > 0) {
      updates.Cost = calculatedCogs;
      updates.Use_BOM = true;
    }
    updateObjectRow('Products', prodTarget._rowIndex, updates);
  }

  logActivity(sessionUser.username, sessionUser.role, 'SAVE_BOM', productId, `${recipes.length} bahan, HPP: Rp ${calculatedCogs}`);
  return { success: true, productId: productId, calculatedCogs: calculatedCogs };
}

function getProductsWithEffectiveStock(includeInactive) {
  const prods = readSheetObjects('Products');
  const materials = getMaterialsList(true);
  const matMap = {};
  materials.forEach(m => { matMap[m.materialId] = m; });

  const allBoms = readSheetObjects('BOM');
  const bomByProduct = {};
  allBoms.forEach(b => {
    const pid = String(b.Product_ID || '');
    if (!bomByProduct[pid]) bomByProduct[pid] = [];
    bomByProduct[pid].push(b);
  });

  return prods.map(p => {
    const pid = String(p.Product_ID || '');
    const physicalStock = Number(p.Stock) || 0;
    const minStock = Number(p.Min_Stock) || 5;
    const useBom = p.Use_BOM === true || String(p.Use_BOM).toLowerCase() === 'true';
    const isActive = p.Is_Active !== false && String(p.Is_Active).toLowerCase() !== 'false';
    const pBoms = bomByProduct[pid] || [];

    let bomMaxPortions = null;
    let bomCogs = 0;

    if (useBom && pBoms.length > 0) {
      let minPortions = Infinity;
      pBoms.forEach(b => {
        const mat = matMap[String(b.Material_ID || '')];
        const qty = Number(b.Qty) || 0;
        const wastePct = Number(b.Waste_Pct) || 0;
        if (mat && qty > 0) {
          const reqBase = convertUnitQty(qty, b.Unit || mat.unit, mat.unit) * (1 + wastePct / 100);
          if (reqBase > 0) {
            const possible = Math.floor(Math.max(0, mat.stock) / reqBase);
            if (possible < minPortions) minPortions = possible;
            bomCogs += reqBase * mat.costPerUnit;
          }
        }
      });
      if (minPortions !== Infinity) bomMaxPortions = minPortions;
    }

    const effectiveStock = (useBom && bomMaxPortions !== null)
      ? Math.min(physicalStock, bomMaxPortions)
      : physicalStock;

    const cost = (useBom && bomCogs > 0) ? Math.round(bomCogs) : (Number(p.Cost) || 0);

    return {
      id: pid,
      productId: pid,
      sku: String(p.SKU || ''),
      name: String(p.Name || '').trim(),
      category: String(p.Category || 'Umum').trim(),
      price: Number(p.Price) || 0,
      cost: cost,
      stock: physicalStock,
      bomMaxPortions: bomMaxPortions,
      effectiveStock: effectiveStock,
      minStock: minStock,
      imageUrl: String(p.Image_URL || ''),
      description: String(p.Description || ''),
      useBom: useBom,
      colorTheme: String(p.Color_Theme || ''),
      isActive: isActive
    };
  }).filter(p => includeInactive ? true : p.isActive);
}

function saveProduct(payload, sessionUser) {
  const p = payload.product || payload;
  const id = String(p.id || p.productId || '').trim();
  const sku = String(p.sku || '').trim();
  const name = String(p.name || '').trim();
  const category = String(p.category || 'Kopi').trim();
  const price = Number(p.price);
  const cost = Number(p.cost) || 0;
  const stock = Number(p.stock);
  const minStock = Number(p.minStock !== undefined ? p.minStock : 5);
  const imageUrl = String(p.imageUrl || '').trim();
  const description = String(p.description || '').trim();
  const useBom = p.useBom === true || String(p.useBom).toLowerCase() === 'true';
  const colorTheme = String(p.colorTheme || '').trim();
  const isActive = p.isActive !== false && String(p.isActive).toLowerCase() !== 'false';

  if (!name) return { error: 'Nama produk wajib diisi.' };
  if (isNaN(price) || price < 0) return { error: 'Harga jual produk tidak valid.' };
  if (isNaN(stock) || stock < 0) return { error: 'Stok produk tidak boleh bernilai negatif.' };

  const rows = readSheetObjects('Products');
  const now = nowStr();

  if (id) {
    const target = rows.find(r => String(r.Product_ID || '') === id);
    if (!target) return { error: 'Produk tidak ditemukan.' };
    const prevStock = Number(target.Stock) || 0;

    updateObjectRow('Products', target._rowIndex, {
      SKU: sku || target.SKU,
      Name: name,
      Category: category,
      Price: price,
      Cost: cost,
      Stock: stock,
      Min_Stock: minStock,
      Image_URL: imageUrl,
      Description: description,
      Use_BOM: useBom,
      Color_Theme: colorTheme || target.Color_Theme || '',
      Is_Active: isActive,
      Updated_At: now
    });

    if (stock !== prevStock) {
      appendObjectRow('Stock_Movements', {
        Movement_ID: generateId('MOV'),
        Timestamp: now,
        Item_Type: 'PRODUCT',
        Item_ID: id,
        Item_Name: name,
        Type: 'EDIT_PRODUCT_STOCK',
        Qty: stock - prevStock,
        Unit: 'pcs',
        Prev_Stock: prevStock,
        New_Stock: stock,
        Unit_Cost: cost,
        Reference_ID: id,
        Notes: 'Perubahan stok via form edit produk',
        Actor: sessionUser.username
      });
    }

    logActivity(sessionUser.username, sessionUser.role, 'UPDATE_PRODUCT', id, `${name} - Rp ${price}`);
    return { success: true, productId: id };
  } else {
    const newId = generateId('PRD');
    const finalSku = sku || ('NK-' + Math.floor(1000 + Math.random() * 9000));
    appendObjectRow('Products', {
      Product_ID: newId,
      SKU: finalSku,
      Name: name,
      Category: category,
      Price: price,
      Cost: cost,
      Stock: stock,
      Min_Stock: minStock,
      Image_URL: imageUrl,
      Description: description,
      Use_BOM: useBom,
      Color_Theme: colorTheme,
      Is_Active: isActive,
      Created_At: now,
      Updated_At: now
    });

    appendObjectRow('Stock_Movements', {
      Movement_ID: generateId('MOV'),
      Timestamp: now,
      Item_Type: 'PRODUCT',
      Item_ID: newId,
      Item_Name: name,
      Type: 'INITIAL_STOCK',
      Qty: stock,
      Unit: 'pcs',
      Prev_Stock: 0,
      New_Stock: stock,
      Unit_Cost: cost,
      Reference_ID: newId,
      Notes: 'Stok awal produk baru',
      Actor: sessionUser.username
    });

    logActivity(sessionUser.username, sessionUser.role, 'CREATE_PRODUCT', newId, `${name} - Rp ${price}`);
    return { success: true, productId: newId };
  }
}

function deleteProduct(payload, sessionUser) {
  const id = String(payload.id || payload.productId || '').trim();
  if (!id) return { error: 'ID Produk wajib diisi.' };
  const ss = getDB();
  const sheet = ss.getSheetByName('Products');
  const rows = readSheetObjects('Products');
  const target = rows.find(r => String(r.Product_ID || '') === id);
  if (!target) return { error: 'Produk tidak ditemukan.' };
  sheet.deleteRow(target._rowIndex);
  logActivity(sessionUser.username, sessionUser.role, 'DELETE_PRODUCT', id, target.Name);
  return { success: true };
}

function addProductStock(payload, sessionUser) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return { error: 'Sistem sibuk memproses stok. Silakan coba lagi.' };
  }

  try {
    const id = String(payload.id || payload.productId || '').trim();
    const mode = String(payload.mode || 'IN').toUpperCase();
    const qty = Number(payload.addedStock !== undefined ? payload.addedStock : payload.qty);
    const notes = String(payload.notes || '').trim();

    if (!id) return { error: 'ID Produk wajib diisi.' };
    if (isNaN(qty) || qty < 0 || (mode !== 'OPNAME' && qty <= 0)) {
      return { error: 'Jumlah penyesuaian stok harus berupa angka positif.' };
    }

    const rows = readSheetObjects('Products');
    const target = rows.find(r => String(r.Product_ID || '') === id);
    if (!target) return { error: 'Produk tidak ditemukan.' };

    const prevStock = Number(target.Stock) || 0;
    let newStock = prevStock;
    let delta = 0;

    if (mode === 'IN') {
      newStock = prevStock + qty;
      delta = qty;
    } else if (mode === 'OUT') {
      if (prevStock < qty) {
        return { error: `Stok fisik tidak mencukupi untuk dikurangi (Stok saat ini: ${prevStock}).` };
      }
      newStock = prevStock - qty;
      delta = -qty;
    } else if (mode === 'OPNAME') {
      newStock = Math.max(0, qty);
      delta = newStock - prevStock;
    } else {
      return { error: 'Mode penyesuaian stok tidak valid.' };
    }

    const now = nowStr();
    updateObjectRow('Products', target._rowIndex, {
      Stock: newStock,
      Updated_At: now
    });

    appendObjectRow('Stock_Movements', {
      Movement_ID: generateId('MOV'),
      Timestamp: now,
      Item_Type: 'PRODUCT',
      Item_ID: id,
      Item_Name: target.Name,
      Type: mode === 'IN' ? 'STOCK_IN' : (mode === 'OUT' ? 'STOCK_OUT' : 'STOCK_OPNAME'),
      Qty: delta,
      Unit: 'pcs',
      Prev_Stock: prevStock,
      New_Stock: newStock,
      Unit_Cost: Number(target.Cost) || 0,
      Reference_ID: 'ADJ-PRD',
      Notes: notes || `Penyesuaian stok produk (${mode})`,
      Actor: sessionUser.username
    });

    logActivity(sessionUser.username, sessionUser.role, 'ADJUST_PRODUCT_STOCK', id, `${target.Name}: ${prevStock} -> ${newStock}`);
    return {
      success: true,
      productId: id,
      prevStock: prevStock,
      newStock: newStock
    };
  } finally {
    lock.releaseLock();
  }
}

function getStockMovements(payload) {
  const limit = Number((payload && payload.limit) || 200);
  const rows = readSheetObjects('Stock_Movements').reverse().slice(0, limit);
  const movements = rows.map(r => ({
    movementId: String(r.Movement_ID || ''),
    timestamp: formatTimestampWIB(r.Timestamp),
    itemType: String(r.Item_Type || ''),
    entityType: String(r.Item_Type || ''),
    itemId: String(r.Item_ID || ''),
    itemName: String(r.Item_Name || ''),
    entityName: String(r.Item_Name || ''),
    type: String(r.Type || ''),
    movementType: String(r.Type || ''),
    qty: Number(r.Qty) || 0,
    qtyChange: Number(r.Qty) || 0,
    unit: String(r.Unit || ''),
    prevStock: Number(r.Prev_Stock) || 0,
    newStock: Number(r.New_Stock) || 0,
    balanceAfter: Number(r.New_Stock) || 0,
    unitCost: Number(r.Unit_Cost) || 0,
    referenceId: String(r.Reference_ID || ''),
    notes: String(r.Notes || ''),
    actor: String(r.Actor || '')
  }));
  return { success: true, movements: movements };
}

// ============================================================================
// 9. MODIFIER & GRUP MODIFIER BERDASARKAN KATEGORI / PRODUK
// ============================================================================
function getModifierGroupsList(includeInactive) {
  const rows = readSheetObjects('Modifier_Groups');
  return rows.map(r => {
    const categories = String(r.Categories || '').split(',').map(s => s.trim()).filter(Boolean);
    const productIds = String(r.Product_IDs || '').split(',').map(s => s.trim()).filter(Boolean);
    const isActive = r.Is_Active !== false && String(r.Is_Active).toLowerCase() !== 'false';
    return {
      groupId: String(r.Group_ID || ''),
      groupName: String(r.Group_Name || '').trim(),
      selectionType: String(r.Selection_Type || (Number(r.Max_Choice) > 1 ? 'MULTIPLE' : 'SINGLE')),
      isRequired: r.Is_Required === true || String(r.Is_Required).toLowerCase() === 'true',
      minSelect: Number(r.Min_Choice) || 0,
      maxSelect: Math.max(1, Number(r.Max_Choice) || 1),
      categories: categories,
      productIds: productIds,
      sortOrder: Number(r.Sort_Order) || 1,
      isActive: isActive
    };
  }).filter(g => includeInactive ? true : g.isActive);
}

function getModifiersList(includeInactive) {
  const groups = getModifierGroupsList(true);
  const groupByName = {};
  groups.forEach(g => { groupByName[g.groupName.toLowerCase()] = g; });

  const rows = readSheetObjects('Modifiers');
  return rows.map(r => {
    const groupName = String(r.Group_Name || '').trim();
    const grp = groupByName[groupName.toLowerCase()];
    const rawCats = String(r.Categories || (grp ? grp.categories.join(',') : '') || '').trim();
    const rawProds = String(r.Product_IDs || (grp ? grp.productIds.join(',') : '') || '').trim();

    const categories = rawCats.split(',').map(s => s.trim()).filter(Boolean);
    const productIds = rawProds.split(',').map(s => s.trim()).filter(Boolean);

    // Format appliesTo yang jelas untuk UI & filter kategori
    let appliesTo = '';
    if (categories.length > 0 && productIds.length > 0) {
      appliesTo = categories.join(', ') + ', ' + productIds.join(', ');
    } else if (categories.length > 0) {
      appliesTo = categories.join(', ');
    } else if (productIds.length > 0) {
      appliesTo = productIds.join(', ');
    } else {
      appliesTo = 'Khusus Produk Tertentu';
    }

    const isRequired = r.Is_Required === true || String(r.Is_Required).toLowerCase() === 'true' || (grp ? grp.isRequired : false);
    const maxSelect = Math.max(1, Number(r.Max_Choice) || (grp ? grp.maxSelect : 1));
    const minSelect = Number(r.Min_Choice) !== undefined && r.Min_Choice !== '' ? Number(r.Min_Choice) : (isRequired ? 1 : 0);
    const price = Number(r.Price) || 0;
    const isActive = r.Is_Active !== false && String(r.Is_Active).toLowerCase() !== 'false';

    return {
      modifierId: String(r.Modifier_ID || ''),
      id: String(r.Modifier_ID || ''),
      groupId: String(r.Group_ID || (grp ? grp.groupId : '')),
      groupName: groupName,
      name: String(r.Name || '').trim(),
      optionName: String(r.Name || '').trim(),
      price: price,
      extraPrice: price,
      isRequired: isRequired,
      minSelect: minSelect,
      maxSelect: maxSelect,
      maxChoice: maxSelect,
      categories: categories,
      productIds: productIds,
      appliesTo: appliesTo,
      materialId: String(r.Material_ID || ''),
      materialQty: Number(r.Material_Qty) || 0,
      isActive: isActive
    };
  }).filter(m => includeInactive ? true : m.isActive);
}

function parseModifierTargets(appliesToRaw, explicitCategories, explicitProductIds) {
  const knownCategories = getCategoriesList(true).map(c => c.name.toLowerCase());
  ['kopi', 'non-kopi', 'minuman', 'makanan', 'snack', 'pastry', 'roti'].forEach(k => {
    if (knownCategories.indexOf(k) === -1) knownCategories.push(k);
  });

  const catSet = [];
  const prodSet = [];

  if (Array.isArray(explicitCategories)) {
    explicitCategories.forEach(c => {
      const s = String(c || '').trim();
      if (s && catSet.indexOf(s) === -1) catSet.push(s);
    });
  } else if (typeof explicitCategories === 'string' && explicitCategories.trim()) {
    explicitCategories.split(',').forEach(c => {
      const s = c.trim();
      if (s && catSet.indexOf(s) === -1) catSet.push(s);
    });
  }

  if (Array.isArray(explicitProductIds)) {
    explicitProductIds.forEach(p => {
      const s = String(p || '').trim();
      if (s && prodSet.indexOf(s) === -1) prodSet.push(s);
    });
  } else if (typeof explicitProductIds === 'string' && explicitProductIds.trim()) {
    explicitProductIds.split(',').forEach(p => {
      const s = p.trim();
      if (s && prodSet.indexOf(s) === -1) prodSet.push(s);
    });
  }

  if (appliesToRaw && catSet.length === 0 && prodSet.length === 0) {
    const parts = String(appliesToRaw).split(',').map(s => s.trim()).filter(Boolean);
    parts.forEach(token => {
      if (token.toUpperCase() === 'ALL') {
        catSet.push('ALL');
      } else if (token.toUpperCase().indexOf('PRD-') === 0) {
        prodSet.push(token);
      } else if (token.toLowerCase() === 'minuman') {
        ['Kopi', 'Non-Kopi', 'Minuman'].forEach(mc => {
          if (catSet.indexOf(mc) === -1) catSet.push(mc);
        });
      } else {
        catSet.push(token);
      }
    });
  }

  return {
    categoriesStr: catSet.join(','),
    productIdsStr: prodSet.join(',')
  };
}

function saveModifier(payload, sessionUser) {
  const mod = (payload && payload.modifier && typeof payload.modifier === 'object') ? payload.modifier : payload;
  const id = String(mod.modifierId || mod.id || '').trim();
  const groupName = String(mod.groupName || '').trim();
  const name = String(mod.optionName || mod.name || '').trim();
  const price = Math.max(0, Number(mod.extraPrice !== undefined ? mod.extraPrice : mod.price) || 0);
  const isRequired = mod.isRequired === true || String(mod.isRequired).toLowerCase() === 'true';
  const maxSelect = Math.max(1, Number(mod.maxSelect !== undefined ? mod.maxSelect : mod.maxChoice) || 1);
  const minSelect = mod.minSelect !== undefined ? Number(mod.minSelect) : (isRequired ? 1 : 0);
  const materialId = String(mod.materialId || '').trim();
  const materialQty = Number(mod.materialQty) || 0;
  const isActive = mod.isActive !== false && String(mod.isActive).toLowerCase() !== 'false';

  if (!groupName || !name) {
    return { error: 'Nama grup modifier dan nama opsi wajib diisi.' };
  }

  const targets = parseModifierTargets(mod.appliesTo, mod.categories, mod.productIds);
  if (!targets.categoriesStr && !targets.productIdsStr) {
    return { error: 'Pilih minimal satu Kategori Produk (misal: Minuman / Makanan / Snack) atau Produk spesifik untuk modifier ini.' };
  }

  // Pastikan grup tercatat di Modifier_Groups
  const groupRows = readSheetObjects('Modifier_Groups');
  let grpRow = groupRows.find(g => String(g.Group_Name || '').trim().toLowerCase() === groupName.toLowerCase());
  let groupId = grpRow ? String(grpRow.Group_ID || '') : generateId('MGRP');

  if (!grpRow) {
    appendObjectRow('Modifier_Groups', {
      Group_ID: groupId,
      Group_Name: groupName,
      Selection_Type: maxSelect > 1 ? 'MULTIPLE' : 'SINGLE',
      Is_Required: isRequired,
      Min_Choice: minSelect,
      Max_Choice: maxSelect,
      Categories: targets.categoriesStr,
      Product_IDs: targets.productIdsStr,
      Sort_Order: groupRows.length + 1,
      Is_Active: true
    });
  } else {
    updateObjectRow('Modifier_Groups', grpRow._rowIndex, {
      Selection_Type: maxSelect > 1 ? 'MULTIPLE' : 'SINGLE',
      Is_Required: isRequired,
      Min_Choice: minSelect,
      Max_Choice: maxSelect,
      Categories: targets.categoriesStr,
      Product_IDs: targets.productIdsStr
    });
  }

  const rows = readSheetObjects('Modifiers');
  if (id) {
    const target = rows.find(r => String(r.Modifier_ID || '') === id);
    if (!target) return { error: 'Data modifier tidak ditemukan untuk diedit.' };
    updateObjectRow('Modifiers', target._rowIndex, {
      Group_ID: groupId,
      Group_Name: groupName,
      Name: name,
      Price: price,
      Is_Required: isRequired,
      Min_Choice: minSelect,
      Max_Choice: maxSelect,
      Categories: targets.categoriesStr,
      Product_IDs: targets.productIdsStr,
      Material_ID: materialId,
      Material_Qty: materialQty,
      Is_Active: isActive
    });

    // Sinkronkan aturan grup pada semua opsi dalam grup yang sama agar konsisten
    rows.forEach(r => {
      if (String(r.Group_Name || '').trim().toLowerCase() === groupName.toLowerCase() && String(r.Modifier_ID || '') !== id) {
        updateObjectRow('Modifiers', r._rowIndex, {
          Group_ID: groupId,
          Is_Required: isRequired,
          Min_Choice: minSelect,
          Max_Choice: maxSelect,
          Categories: targets.categoriesStr,
          Product_IDs: targets.productIdsStr
        });
      }
    });

    logActivity(sessionUser.username, sessionUser.role, 'UPDATE_MODIFIER', id, `${groupName}: ${name} (+Rp ${price})`);
    const allMods = getModifiersList(true);
    return { success: true, modifierId: id, modifier: allMods.find(m => m.modifierId === id), modifiers: allMods };
  } else {
    const newId = generateId('MOD');
    appendObjectRow('Modifiers', {
      Modifier_ID: newId,
      Group_ID: groupId,
      Group_Name: groupName,
      Name: name,
      Price: price,
      Is_Required: isRequired,
      Min_Choice: minSelect,
      Max_Choice: maxSelect,
      Categories: targets.categoriesStr,
      Product_IDs: targets.productIdsStr,
      Material_ID: materialId,
      Material_Qty: materialQty,
      Is_Active: isActive
    });

    // Sinkronkan aturan grup pada opsi lain di grup yang sama
    rows.forEach(r => {
      if (String(r.Group_Name || '').trim().toLowerCase() === groupName.toLowerCase()) {
        updateObjectRow('Modifiers', r._rowIndex, {
          Group_ID: groupId,
          Is_Required: isRequired,
          Min_Choice: minSelect,
          Max_Choice: maxSelect,
          Categories: targets.categoriesStr,
          Product_IDs: targets.productIdsStr
        });
      }
    });

    logActivity(sessionUser.username, sessionUser.role, 'CREATE_MODIFIER', newId, `${groupName}: ${name} (+Rp ${price})`);
    const allMods = getModifiersList(true);
    return { success: true, modifierId: newId, modifier: allMods.find(m => m.modifierId === newId), modifiers: allMods };
  }
}

function deleteModifier(payload, sessionUser) {
  const id = String(payload.modifierId || payload.id || '').trim();
  if (!id) return { error: 'ID modifier wajib diisi.' };

  const ss = getDB();
  const sheet = ss.getSheetByName('Modifiers');
  const rows = readSheetObjects('Modifiers');
  const target = rows.find(r => String(r.Modifier_ID || '') === id);
  if (!target) return { error: 'Modifier tidak ditemukan.' };

  sheet.deleteRow(target._rowIndex);
  logActivity(sessionUser.username, sessionUser.role, 'DELETE_MODIFIER', id, `${target.Group_Name} - ${target.Name}`);
  return { success: true, modifiers: getModifiersList(true) };
}

function saveModifierGroup(payload, sessionUser) {
  const g = payload.group || payload;
  const groupId = String(g.groupId || '').trim();
  const groupName = String(g.groupName || '').trim();
  if (!groupName) return { error: 'Nama grup modifier wajib diisi.' };

  const isRequired = g.isRequired === true || String(g.isRequired).toLowerCase() === 'true';
  const maxSelect = Math.max(1, Number(g.maxSelect || g.maxChoice) || 1);
  const minSelect = g.minSelect !== undefined ? Number(g.minSelect) : (isRequired ? 1 : 0);
  const targets = parseModifierTargets(g.appliesTo, g.categories, g.productIds);

  const rows = readSheetObjects('Modifier_Groups');
  const existing = rows.find(r =>
    (groupId && String(r.Group_ID || '') === groupId) ||
    String(r.Group_Name || '').trim().toLowerCase() === groupName.toLowerCase()
  );

  if (existing) {
    updateObjectRow('Modifier_Groups', existing._rowIndex, {
      Group_Name: groupName,
      Selection_Type: maxSelect > 1 ? 'MULTIPLE' : 'SINGLE',
      Is_Required: isRequired,
      Min_Choice: minSelect,
      Max_Choice: maxSelect,
      Categories: targets.categoriesStr,
      Product_IDs: targets.productIdsStr,
      Is_Active: g.isActive !== false
    });
    return { success: true, groupId: existing.Group_ID };
  } else {
    const newId = generateId('MGRP');
    appendObjectRow('Modifier_Groups', {
      Group_ID: newId,
      Group_Name: groupName,
      Selection_Type: maxSelect > 1 ? 'MULTIPLE' : 'SINGLE',
      Is_Required: isRequired,
      Min_Choice: minSelect,
      Max_Choice: maxSelect,
      Categories: targets.categoriesStr,
      Product_IDs: targets.productIdsStr,
      Sort_Order: rows.length + 1,
      Is_Active: true
    });
    return { success: true, groupId: newId };
  }
}

function deleteModifierGroup(payload, sessionUser) {
  const groupId = String(payload.groupId || payload.id || '').trim();
  if (!groupId) return { error: 'ID grup modifier wajib diisi.' };
  const ss = getDB();
  const sheet = ss.getSheetByName('Modifier_Groups');
  const rows = readSheetObjects('Modifier_Groups');
  const target = rows.find(r => String(r.Group_ID || '') === groupId);
  if (!target) return { error: 'Grup modifier tidak ditemukan.' };
  sheet.deleteRow(target._rowIndex);
  return { success: true };
}

// ============================================================================
// 10. DISKON, PROMO & MEMBER LOYALITAS (DENGAN NORMALISASI NOMOR HP)
// ============================================================================
function getDiscountsList(includeInactive) {
  const rows = readSheetObjects('Discounts');
  const today = todayStr();

  return rows.map(r => {
    const rawType = String(r.Type || 'PERCENT').toUpperCase();
    const normType = (rawType === 'PERCENTAGE' || rawType === 'PERCENT') ? 'PERCENT' : 'NOMINAL';
    const startDate = normalizeDateWIB(r.Start_Date);
    const endDate = normalizeDateWIB(r.End_Date);
    const isActiveFlag = r.Is_Active !== false && String(r.Is_Active).toLowerCase() !== 'false';
    const withinDate = (!startDate || today >= startDate) && (!endDate || today <= endDate);

    return {
      discountId: String(r.Discount_ID || ''),
      id: String(r.Discount_ID || ''),
      code: String(r.Code || '').trim().toUpperCase(),
      name: String(r.Title || '').trim(),
      title: String(r.Title || '').trim(),
      type: normType,
      value: Number(r.Value) || 0,
      minOrder: Number(r.Min_Purchase) || 0,
      minPurchase: Number(r.Min_Purchase) || 0,
      maxDiscount: Number(r.Max_Discount) || 0,
      startDate: startDate,
      endDate: endDate,
      targetCategory: String(r.Target_Category || 'ALL').trim(),
      targetProductIds: String(r.Target_Product_IDs || '').trim(),
      memberOnly: r.Member_Only === true || String(r.Member_Only).toLowerCase() === 'true',
      isActive: isActiveFlag,
      isValidToday: isActiveFlag && withinDate
    };
  }).filter(d => includeInactive ? true : d.isValidToday);
}

function saveDiscount(payload, sessionUser) {
  const d = (payload && payload.discount && typeof payload.discount === 'object') ? payload.discount : payload;
  const id = String(d.discountId || d.id || '').trim();
  const code = String(d.code || '').trim().toUpperCase();
  const title = String(d.name || d.title || '').trim();
  const rawType = String(d.type || 'PERCENT').toUpperCase();
  const type = (rawType === 'PERCENTAGE' || rawType === 'PERCENT') ? 'PERCENT' : 'NOMINAL';
  const value = Number(d.value);
  const minPurchase = Math.max(0, Number(d.minOrder !== undefined ? d.minOrder : d.minPurchase) || 0);
  const maxDiscount = Math.max(0, Number(d.maxDiscount) || 0);
  const startDate = normalizeDateWIB(d.startDate) || '2025-01-01';
  const endDate = normalizeDateWIB(d.endDate) || '2028-12-31';
  const targetCategory = String(d.targetCategory || d.appliesTo || 'ALL').trim();
  const targetProductIds = String(d.targetProductIds || '').trim();
  const memberOnly = d.memberOnly === true || String(d.memberOnly).toLowerCase() === 'true';
  const isActive = d.isActive !== false && String(d.isActive).toLowerCase() !== 'false';

  if (!code || !title) {
    return { error: 'Kode promo dan nama promo diskon wajib diisi.' };
  }
  if (isNaN(value) || value <= 0) {
    return { error: 'Nilai potongan diskon harus lebih besar dari 0.' };
  }
  if (type === 'PERCENT' && value > 100) {
    return { error: 'Diskon persentase tidak boleh melebihi 100%.' };
  }

  const rows = readSheetObjects('Discounts');
  const dup = rows.find(r =>
    String(r.Code || '').trim().toUpperCase() === code &&
    String(r.Discount_ID || '') !== id
  );
  if (dup) {
    return { error: `Kode promo "${code}" sudah digunakan.` };
  }

  if (id) {
    const target = rows.find(r => String(r.Discount_ID || '') === id);
    if (!target) return { error: 'Data promo diskon tidak ditemukan.' };
    updateObjectRow('Discounts', target._rowIndex, {
      Code: code,
      Title: title,
      Type: type,
      Value: value,
      Min_Purchase: minPurchase,
      Max_Discount: maxDiscount,
      Start_Date: startDate,
      End_Date: endDate,
      Target_Category: targetCategory,
      Target_Product_IDs: targetProductIds,
      Member_Only: memberOnly,
      Is_Active: isActive
    });
    logActivity(sessionUser.username, sessionUser.role, 'UPDATE_DISCOUNT', id, `${code} (${title})`);
    const allDiscs = getDiscountsList(true);
    return {
      success: true,
      discountId: id,
      discount: allDiscs.find(d => d.discountId === id) || null,
      discounts: allDiscs
    };
  } else {
    const newId = generateId('DSC');
    appendObjectRow('Discounts', {
      Discount_ID: newId,
      Code: code,
      Title: title,
      Type: type,
      Value: value,
      Min_Purchase: minPurchase,
      Max_Discount: maxDiscount,
      Start_Date: startDate,
      End_Date: endDate,
      Target_Category: targetCategory,
      Target_Product_IDs: targetProductIds,
      Member_Only: memberOnly,
      Is_Active: isActive
    });
    logActivity(sessionUser.username, sessionUser.role, 'CREATE_DISCOUNT', newId, `${code} (${title})`);
    const allDiscs = getDiscountsList(true);
    return {
      success: true,
      discountId: newId,
      discount: allDiscs.find(d => d.discountId === newId) || null,
      discounts: allDiscs
    };
  }
}

function deleteDiscount(payload, sessionUser) {
  const id = String(payload.discountId || payload.id || '').trim();
  if (!id) return { error: 'ID diskon wajib diisi.' };

  const ss = getDB();
  const sheet = ss.getSheetByName('Discounts');
  const rows = readSheetObjects('Discounts');
  const target = rows.find(r => String(r.Discount_ID || '') === id);
  if (!target) return { error: 'Diskon tidak ditemukan.' };

  sheet.deleteRow(target._rowIndex);
  logActivity(sessionUser.username, sessionUser.role, 'DELETE_DISCOUNT', id, target.Code);
  return { success: true, discounts: getDiscountsList(true) };
}

/**
 * Normalisasi nomor HP Indonesia secara konsisten:
 * Menerima format 08..., 628..., +628..., 8... (jika terpotong angka 0 oleh Sheets)
 * Mengembalikan string angka bersih yang diawali '08...' (atau '0...').
 */
function normalizePhoneNumber(rawPhone) {
  if (rawPhone === undefined || rawPhone === null) return '';
  let digits = String(rawPhone).replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.indexOf('62') === 0 && digits.length >= 10) {
    digits = '0' + digits.substring(2);
  } else if (digits.indexOf('8') === 0 && digits.length >= 8) {
    digits = '0' + digits;
  }
  return digits;
}

function searchMembers(payload) {
  const q = String((payload && payload.query) || '').trim().toLowerCase();
  const qDigits = q.replace(/[^0-9]/g, '');
  const rows = readSheetObjects('Members');

  const list = rows.map(r => {
    const name = String(r.Name || '').trim();
    const phone = normalizePhoneNumber(r.Phone);
    const isActive = r.Is_Active !== false && String(r.Is_Active).toLowerCase() !== 'false';
    return {
      memberId: String(r.Member_ID || ''),
      id: String(r.Member_ID || ''),
      name: name,
      fullName: name,
      phone: phone,
      email: String(r.Email || ''),
      points: Number(r.Points) || 0,
      tier: String(r.Tier || 'Regular'),
      totalSpent: Number(r.Total_Spent) || 0,
      visitCount: Number(r.Visit_Count) || 0,
      notes: String(r.Notes || ''),
      isActive: isActive,
      joinDate: formatTimestampWIB(r.Join_Date),
      lastVisit: formatTimestampWIB(r.Last_Visit)
    };
  }).filter(m => {
    if (!m.isActive && (!payload || !payload.includeInactive)) return false;
    if (!q) return true;
    const matchName = m.name.toLowerCase().indexOf(q) !== -1;
    const matchId = m.memberId.toLowerCase().indexOf(q) !== -1;
    const matchPhone = m.phone.indexOf(q) !== -1 || (qDigits && m.phone.indexOf(qDigits) !== -1);
    return matchName || matchId || matchPhone;
  });

  return { success: true, members: list };
}

function getMemberDetail(payload) {
  const memberId = String(payload.memberId || payload.id || '').trim();
  if (!memberId) return { error: 'ID member wajib diisi.' };
  const all = searchMembers({ includeInactive: true }).members;
  const member = all.find(m => m.memberId === memberId);
  if (!member) return { error: 'Member tidak ditemukan.' };

  const history = readSheetObjects('Point_History')
    .filter(p => String(p.Member_ID || '') === memberId)
    .map(p => ({
      logId: String(p.Log_ID || ''),
      timestamp: formatTimestampWIB(p.Timestamp),
      txId: String(p.Tx_ID || ''),
      type: String(p.Type || ''),
      points: Number(p.Points) || 0,
      balanceAfter: Number(p.Balance_After) || 0,
      notes: String(p.Notes || '')
    })).reverse();

  return { success: true, member: member, pointHistory: history };
}

function saveMember(payload, sessionUser) {
  const m = (payload && payload.member && typeof payload.member === 'object') ? payload.member : payload;
  const id = String(m.memberId || m.id || '').trim();
  const name = String(m.fullName || m.name || '').trim();
  const rawPhone = String(m.phone || '').trim();
  const phone = normalizePhoneNumber(rawPhone);
  const email = String(m.email || '').trim();
  const notes = String(m.notes || '').trim();
  const isActive = m.isActive !== false && String(m.isActive).toLowerCase() !== 'false';

  if (!name) {
    return { error: 'Nama pelanggan member wajib diisi.' };
  }
  if (!phone || phone.length < 9 || phone.length > 16) {
    return { error: 'Nomor HP member tidak valid. Masukkan nomor HP aktif (minimal 9 digit angka, contoh: 08123456789).' };
  }

  const rows = readSheetObjects('Members');
  const dup = rows.find(r =>
    normalizePhoneNumber(r.Phone) === phone &&
    String(r.Member_ID || '') !== id
  );
  if (dup) {
    return { error: `Nomor HP ${phone} sudah terdaftar atas nama ${dup.Name} (${dup.Member_ID}).` };
  }

  const now = nowStr();
  if (id) {
    const target = rows.find(r => String(r.Member_ID || '') === id);
    if (!target) return { error: 'Data member tidak ditemukan untuk diedit.' };

    const points = m.points !== undefined && m.points !== '' ? Number(m.points) : (Number(target.Points) || 0);
    const totalSpent = Number(target.Total_Spent) || 0;
    const tier = m.tier || calculateMemberTier(totalSpent);

    updateObjectRow('Members', target._rowIndex, {
      Name: name,
      Phone: phone,
      Email: email,
      Points: points,
      Tier: tier,
      Notes: notes,
      Is_Active: isActive
    }, ['Phone']);

    const updatedObj = {
      memberId: id, id: id, name: name, fullName: name, phone: phone,
      email: email, points: points, tier: tier, totalSpent: totalSpent,
      visitCount: Number(target.Visit_Count) || 0, notes: notes, isActive: isActive
    };
    logActivity(sessionUser.username, sessionUser.role, 'UPDATE_MEMBER', id, `${name} (${phone})`);
    return { success: true, memberId: id, member: updatedObj };
  } else {
    const newId = generateId('MEM');
    appendObjectRow('Members', {
      Member_ID: newId,
      Name: name,
      Phone: phone,
      Email: email,
      Points: 0,
      Tier: 'Regular',
      Total_Spent: 0,
      Visit_Count: 0,
      Notes: notes,
      Is_Active: true,
      Join_Date: now,
      Last_Visit: now
    }, ['Phone']);

    const newObj = {
      memberId: newId, id: newId, name: name, fullName: name, phone: phone,
      email: email, points: 0, tier: 'Regular', totalSpent: 0,
      visitCount: 0, notes: notes, isActive: true
    };
    logActivity(sessionUser.username, sessionUser.role, 'CREATE_MEMBER', newId, `${name} (${phone})`);
    return { success: true, memberId: newId, member: newObj };
  }
}

function calculateMemberTier(totalSpent) {
  const spent = Number(totalSpent) || 0;
  if (spent >= 1000000) return 'Platinum';
  if (spent >= 350000) return 'Gold';
  if (spent >= 100000) return 'Silver';
  return 'Regular';
}

// ============================================================================
// 11. BOOTSTRAP POS, PROSES CHECKOUT TRANSAKSI & CETAK STRUK
// ============================================================================
function getSettingsMap() {
  const rows = readSheetObjects('Settings');
  const map = {};
  rows.forEach(r => {
    const k = String(r.Key || '').trim();
    if (k) map[k] = String(r.Value !== undefined && r.Value !== null ? r.Value : '');
  });
  return map;
}

function getPOSBootstrap(sessionUser) {
  const settings = getSettingsMap();
  const products = getProductsWithEffectiveStock(true);
  const categories = getCategoriesList(true);
  const modifiers = getModifiersList(true);
  const modifierGroups = getModifierGroupsList(true);
  const discounts = getDiscountsList(false);
  const shiftRes = getActiveShiftSession(sessionUser);

  return {
    success: true,
    stage: 'POS_BOOTSTRAP_OK',
    dbId: DB_ID,
    user: sessionUser ? {
      userId: sessionUser.userId,
      username: sessionUser.username,
      role: sessionUser.role,
      fullName: sessionUser.fullName,
      mustChangePassword: Boolean(sessionUser.mustChangePassword)
    } : null,
    products: products,
    categories: categories,
    modifiers: modifiers,
    modifierGroups: modifierGroups,
    discounts: discounts,
    settings: settings,
    activeShift: shiftRes.activeShift
  };
}

function applyRoundingBackend(amount, mode) {
  const val = Math.round(Number(amount) || 0);
  const m = String(mode || 'NONE').toUpperCase();
  if (m === 'NONE') return { finalTotal: val, roundingAdjustment: 0 };
  let rounded = val;
  if (m === 'NEAREST_100') rounded = Math.round(val / 100) * 100;
  else if (m === 'NEAREST_500') rounded = Math.round(val / 500) * 500;
  else if (m === 'UP_100') rounded = Math.ceil(val / 100) * 100;
  else if (m === 'DOWN_100') rounded = Math.floor(val / 100) * 100;
  return { finalTotal: rounded, roundingAdjustment: rounded - val };
}

function processTransaction(payload, sessionUser) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    return { error: 'Sistem sedang memproses transaksi lain. Mohon tunggu sebentar dan coba lagi.' };
  }

  try {
    const cart = Array.isArray(payload.cart) ? payload.cart : (Array.isArray(payload.items) ? payload.items : []);
    if (cart.length === 0) {
      return { error: 'Keranjang belanja kosong.' };
    }

    const settings = getSettingsMap();
    const requireShift = String(settings.require_open_shift || 'true').toLowerCase() === 'true';
    const shiftSessions = readSheetObjects('Shift_Sessions');
    let openShift = shiftSessions.find(s =>
      String(s.Status || '').toUpperCase() === 'OPEN' &&
      String(s.Username || '').trim().toLowerCase() === sessionUser.username
    );
    if (!openShift) {
      openShift = shiftSessions.find(s => String(s.Status || '').toUpperCase() === 'OPEN');
    }
    if (requireShift && !openShift) {
      return { error: 'Shift kasir belum dibuka. Silakan buka shift dan masukkan modal awal kas terlebih dahulu.' };
    }

    // Cek Idempotency Key untuk mencegah dobel transaksi saat tombol diklik ganda
    const idempotencyKey = String(payload.idempotencyKey || '').trim();
    if (idempotencyKey) {
      const existingTxs = readSheetObjects('Transactions');
      const dupTx = existingTxs.find(t => String(t.Idempotency_Key || '') === idempotencyKey);
      if (dupTx) {
        const dupRes = getTransactionReceipt(dupTx.Tx_ID);
        dupRes.duplicate = true;
        return dupRes;
      }
    }

    // Baca data master produk, BOM, bahan baku, dan modifier
    const prodRows = readSheetObjects('Products');
    const prodMap = {};
    prodRows.forEach(p => { prodMap[String(p.Product_ID || '')] = p; });

    const matRows = readSheetObjects('Materials');
    const matMap = {};
    matRows.forEach(m => { matMap[String(m.Material_ID || '')] = m; });

    const bomRows = readSheetObjects('BOM');
    const bomByProd = {};
    bomRows.forEach(b => {
      const pid = String(b.Product_ID || '');
      if (!bomByProd[pid]) bomByProd[pid] = [];
      bomByProd[pid].push(b);
    });

    const modRows = readSheetObjects('Modifiers');
    const modMap = {};
    modRows.forEach(m => { modMap[String(m.Modifier_ID || '')] = m; });

    // Akumulasi kebutuhan stok produk fisik dan bahan baku BOM untuk seluruh keranjang
    const requiredProdQty = {};
    const requiredMatQty = {}; // dalam satuan dasar masing-masing material
    const verifiedItems = [];
    let subtotal = 0;

    for (let i = 0; i < cart.length; i++) {
      const c = cart[i];
      const pid = String(c.id || c.productId || '').trim();
      const qty = Math.floor(Number(c.qty) || 0);
      if (!pid || qty <= 0) {
        return { error: 'Terdapat item dengan jumlah tidak valid di keranjang.' };
      }

      const pRow = prodMap[pid];
      if (!pRow) {
        return { error: `Produk dengan ID ${pid} tidak ditemukan di database.` };
      }
      if (pRow.Is_Active === false || String(pRow.Is_Active).toLowerCase() === 'false') {
        return { error: `Produk "${pRow.Name}" sedang nonaktif.` };
      }

      requiredProdQty[pid] = (requiredProdQty[pid] || 0) + qty;
      const basePrice = Number(pRow.Price) || 0;

      // Verifikasi modifier yang dipilih (harga dari database/snapshot tervalidasi)
      const rawMods = Array.isArray(c.modifiers) ? c.modifiers : [];
      const snapshotMods = [];
      let modUnitTotal = 0;

      rawMods.forEach(rm => {
        const mid = String(rm.modifierId || rm.id || '').trim();
        const dbMod = modMap[mid];
        const mPrice = dbMod ? (Number(dbMod.Price) || 0) : (Number(rm.extraPrice || rm.price) || 0);
        const mName = dbMod ? String(dbMod.Name || '') : String(rm.optionName || rm.name || '');
        const mGroup = dbMod ? String(dbMod.Group_Name || '') : String(rm.groupName || '');
        modUnitTotal += mPrice;
        snapshotMods.push({
          modifierId: mid,
          groupName: mGroup,
          optionName: mName,
          extraPrice: mPrice
        });

        // Jika modifier memiliki kaitan bahan baku tambahan
        if (dbMod && dbMod.Material_ID && Number(dbMod.Material_Qty) > 0) {
          const mMatId = String(dbMod.Material_ID);
          const mMat = matMap[mMatId];
          if (mMat) {
            requiredMatQty[mMatId] = (requiredMatQty[mMatId] || 0) + (Number(dbMod.Material_Qty) * qty);
          }
        }
      });

      // Hitung kebutuhan bahan baku BOM jika produk menggunakan BOM
      const useBom = pRow.Use_BOM === true || String(pRow.Use_BOM).toLowerCase() === 'true';
      const pBoms = bomByProd[pid] || [];
      let unitCogs = Number(pRow.Cost) || 0;

      if (useBom && pBoms.length > 0) {
        let calcUnitCogs = 0;
        pBoms.forEach(b => {
          const mid = String(b.Material_ID || '');
          const mat = matMap[mid];
          const bQty = Number(b.Qty) || 0;
          const wastePct = Number(b.Waste_Pct) || 0;
          if (mat && bQty > 0) {
            const baseReqPerUnit = convertUnitQty(bQty, b.Unit || mat.Unit, mat.Unit) * (1 + wastePct / 100);
            requiredMatQty[mid] = (requiredMatQty[mid] || 0) + (baseReqPerUnit * qty);
            calcUnitCogs += baseReqPerUnit * (Number(mat.Cost_Per_Unit) || 0);
          }
        });
        if (calcUnitCogs > 0) unitCogs = Math.round(calcUnitCogs);
      }

      const unitPrice = basePrice + modUnitTotal;
      const lineSubtotal = unitPrice * qty;
      subtotal += lineSubtotal;

      verifiedItems.push({
        id: pid,
        productId: pid,
        name: String(pRow.Name || ''),
        productName: String(pRow.Name || ''),
        category: String(pRow.Category || 'Umum'),
        qty: qty,
        basePrice: basePrice,
        modifiers: snapshotMods,
        modifierTotal: modUnitTotal,
        unitPrice: unitPrice,
        price: unitPrice,
        lineTotal: lineSubtotal,
        unitCogs: unitCogs,
        totalCogs: unitCogs * qty,
        useBom: useBom,
        itemNote: String(c.itemNote || '').trim()
      });
    }

    // Validasi ketersediaan stok fisik produk
    const prodIds = Object.keys(requiredProdQty);
    for (let i = 0; i < prodIds.length; i++) {
      const pid = prodIds[i];
      const pRow = prodMap[pid];
      const avail = Number(pRow.Stock) || 0;
      if (avail < requiredProdQty[pid]) {
        return { error: `Stok produk "${pRow.Name}" tidak mencukupi (Tersedia: ${avail}, Dibutuhkan: ${requiredProdQty[pid]}).` };
      }
    }

    // Validasi ketersediaan stok bahan baku BOM
    const matIds = Object.keys(requiredMatQty);
    for (let i = 0; i < matIds.length; i++) {
      const mid = matIds[i];
      const mRow = matMap[mid];
      if (mRow) {
        const avail = Number(mRow.Stock) || 0;
        const req = requiredMatQty[mid];
        if (avail < req) {
          return {
            error: `Stok bahan baku "${mRow.Name}" tidak mencukupi untuk resep BOM (Tersedia: ${avail.toFixed(1)} ${mRow.Unit}, Dibutuhkan: ${req.toFixed(1)} ${mRow.Unit}).`
          };
        }
      }
    }

    // Validasi Member & Diskon
    const memberId = String(payload.memberId || '').trim();
    let memberRow = null;
    if (memberId) {
      const memRows = readSheetObjects('Members');
      memberRow = memRows.find(m => String(m.Member_ID || '') === memberId);
    }

    let promoDiscount = 0;
    const discountId = String(payload.discountId || '').trim();
    const manualVal = Number(payload.manualDiscountValue) || 0;
    const manualType = String(payload.manualDiscountType || 'NOMINAL').toUpperCase();

    if (discountId) {
      const discList = getDiscountsList(false);
      const rule = discList.find(d => d.discountId === discountId || d.code === discountId.toUpperCase());
      if (!rule) {
        return { error: 'Promo diskon yang dipilih sudah tidak aktif atau di luar periode berlaku.' };
      }
      if (rule.memberOnly && !memberRow) {
        return { error: `Promo "${rule.name}" hanya berlaku untuk pelanggan Member.` };
      }
      if (subtotal < rule.minOrder) {
        return { error: `Minimum belanja untuk promo "${rule.name}" adalah Rp ${rule.minOrder}.` };
      }
      promoDiscount = rule.type === 'PERCENT' ? Math.round(subtotal * (rule.value / 100)) : rule.value;
      if (rule.maxDiscount > 0 && promoDiscount > rule.maxDiscount) {
        promoDiscount = rule.maxDiscount;
      }
    } else if (manualVal > 0) {
      promoDiscount = manualType === 'PERCENT'
        ? Math.round(subtotal * (Math.min(100, manualVal) / 100))
        : manualVal;
    }
    promoDiscount = Math.min(subtotal, Math.max(0, promoDiscount));

    // Penukaran Poin Member
    let pointsRedeemed = 0;
    let pointDiscount = 0;
    if (memberRow && Number(payload.pointsRedeemed) > 0) {
      const reqPoints = Math.floor(Number(payload.pointsRedeemed) || 0);
      const availPoints = Number(memberRow.Points) || 0;
      pointsRedeemed = Math.min(availPoints, Math.max(0, reqPoints));
      const redeemRate = Number(settings.member_rupiah_per_point || settings.member_redeem_value_rp || 500);
      pointDiscount = Math.min(subtotal - promoDiscount, pointsRedeemed * redeemRate);
    }

    const totalDiscount = promoDiscount + pointDiscount;
    const afterDiscount = Math.max(0, subtotal - totalDiscount);

    // Perhitungan Pajak PB1 & Pembulatan
    const taxEnabled = String(settings.tax_enabled || 'true').toLowerCase() === 'true';
    const taxRate = taxEnabled ? (Number(settings.tax_rate) || 0) : 0;
    const taxMode = String(settings.tax_mode || 'EXCLUSIVE').toUpperCase();
    const taxName = String(settings.tax_name || 'PB1');

    let taxAmount = 0;
    let preRoundTotal = afterDiscount;
    if (taxEnabled && taxRate > 0 && afterDiscount > 0) {
      if (taxMode === 'INCLUSIVE') {
        taxAmount = Math.round(afterDiscount - (afterDiscount / (1 + taxRate / 100)));
        preRoundTotal = afterDiscount;
      } else {
        taxAmount = Math.round(afterDiscount * (taxRate / 100));
        preRoundTotal = afterDiscount + taxAmount;
      }
    }

    const roundObj = applyRoundingBackend(preRoundTotal, settings.rounding_mode || 'NONE');
    const grandTotal = roundObj.finalTotal;

    // Validasi Metode Pembayaran
    const paymentMethod = String(payload.paymentMethod || 'Cash').trim();
    const paymentStatus = String(payload.paymentStatus || 'Berhasil').trim();
    const paymentReference = String(payload.paymentReference || '').trim();
    const paymentSplit = Array.isArray(payload.paymentSplit) ? payload.paymentSplit : [];
    let amountPaid = Number(payload.amountPaid !== undefined ? payload.amountPaid : (payload.cashReceived !== undefined ? payload.cashReceived : grandTotal));

    if (paymentMethod === 'Cash' && amountPaid < grandTotal) {
      return { error: `Nominal uang tunai diterima (Rp ${amountPaid}) kurang dari total tagihan (Rp ${grandTotal}).` };
    }
    if (paymentMethod === 'Split Bill') {
      const sumSplit = paymentSplit.reduce((s, x) => s + (Number(x.amount) || 0), 0);
      if (sumSplit < grandTotal) {
        return { error: `Total pembayaran Split Bill (Rp ${sumSplit}) kurang dari total tagihan (Rp ${grandTotal}).` };
      }
      amountPaid = sumSplit;
    }

    const changeAmount = Math.max(0, amountPaid - grandTotal);
    const txId = generateId('TX');
    const now = nowStr();
    const dateWib = todayStr();

    // Hitung Poin Member yang Diperoleh
    const earnRate = Math.max(1000, Number(settings.member_points_per_rupiah || 10000));
    const pointsEarned = memberRow ? Math.floor(afterDiscount / earnRate) : 0;

    // 1. Kurangi Stok Produk & Catat Stock_Movements
    prodIds.forEach(pid => {
      const pRow = prodMap[pid];
      const prev = Number(pRow.Stock) || 0;
      const used = requiredProdQty[pid];
      const next = Math.max(0, prev - used);
      updateObjectRow('Products', pRow._rowIndex, { Stock: next, Updated_At: now });

      appendObjectRow('Stock_Movements', {
        Movement_ID: generateId('MOV'),
        Timestamp: now,
        Item_Type: 'PRODUCT',
        Item_ID: pid,
        Item_Name: pRow.Name,
        Type: 'SALE_OUT',
        Qty: -used,
        Unit: 'pcs',
        Prev_Stock: prev,
        New_Stock: next,
        Unit_Cost: Number(pRow.Cost) || 0,
        Reference_ID: txId,
        Notes: 'Penjualan POS ' + txId,
        Actor: sessionUser.username
      });
    });

    // 2. Kurangi Stok Bahan Baku BOM (Sekali saja per transaksi, tanpa double deduction)
    matIds.forEach(mid => {
      const mRow = matMap[mid];
      if (!mRow) return;
      const prev = Number(mRow.Stock) || 0;
      const used = Number(requiredMatQty[mid].toFixed(2));
      const next = Number(Math.max(0, prev - used).toFixed(2));
      updateObjectRow('Materials', mRow._rowIndex, { Stock: next, Updated_At: now });

      appendObjectRow('Stock_Movements', {
        Movement_ID: generateId('MOV'),
        Timestamp: now,
        Item_Type: 'MATERIAL',
        Item_ID: mid,
        Item_Name: mRow.Name,
        Type: 'BOM_DEDUCTION',
        Qty: -used,
        Unit: mRow.Unit,
        Prev_Stock: prev,
        New_Stock: next,
        Unit_Cost: Number(mRow.Cost_Per_Unit) || 0,
        Reference_ID: txId,
        Notes: 'Pemotongan otomatis resep BOM ' + txId,
        Actor: sessionUser.username
      });
    });

    // 3. Simpan Rincian Item ke Transaction_Items
    let totalCogs = 0;
    const itemsSummaryParts = [];

    verifiedItems.forEach((item, idx) => {
      totalCogs += item.totalCogs;
      const modNames = item.modifiers.map(m => m.optionName).join(', ');
      itemsSummaryParts.push(`${item.name}${modNames ? ' (' + modNames + ')' : ''} x${item.qty}`);

      const allocDisc = subtotal > 0 ? Math.round((item.lineTotal / subtotal) * totalDiscount) : 0;
      const netSales = item.lineTotal - allocDisc;
      const grossProfit = netSales - item.totalCogs;

      appendObjectRow('Transaction_Items', {
        Item_Row_ID: `${txId}-ITM-${idx + 1}`,
        Tx_ID: txId,
        Timestamp: now,
        Date_WIB: dateWib,
        Product_ID: item.productId,
        Product_Name: item.productName,
        Category: item.category,
        Qty: item.qty,
        Base_Price: item.basePrice,
        Modifiers_JSON: JSON.stringify(item.modifiers),
        Modifier_Total: item.modifierTotal,
        Unit_Price: item.unitPrice,
        Subtotal: item.lineTotal,
        Discount_Allocated: allocDisc,
        Net_Sales: netSales,
        Unit_COGS: item.unitCogs,
        Total_COGS: item.totalCogs,
        Gross_Profit: grossProfit,
        Refunded_Qty: 0,
        Notes: item.itemNote
      });
    });

    const itemsSummary = itemsSummaryParts.join(', ');
    const orderType = String(payload.orderType || 'Dine In').trim();
    const tableNumber = String(payload.tableNumber || '').trim();
    const notes = String(payload.notes || '').trim();
    const shiftSessionId = openShift ? String(openShift.Session_ID || '') : '';

    // 4. Simpan Header Transaksi ke Transactions
    appendObjectRow('Transactions', {
      Tx_ID: txId,
      Idempotency_Key: idempotencyKey || txId,
      Timestamp: now,
      Date_WIB: dateWib,
      Cashier: sessionUser.username,
      Order_Type: orderType,
      Table_Number: tableNumber,
      Customer_Name: memberRow ? memberRow.Name : tableNumber,
      Member_ID: memberRow ? memberRow.Member_ID : '',
      Items_JSON: JSON.stringify(verifiedItems),
      Items_Summary: itemsSummary,
      Subtotal: subtotal,
      Discount_ID: discountId,
      Discount_Amount: totalDiscount,
      Points_Redeemed: pointsRedeemed,
      Points_Discount: pointDiscount,
      Points_Earned: pointsEarned,
      Tax_Rate: taxRate,
      Tax_Mode: taxMode,
      Tax_Amount: taxAmount,
      Rounding_Amount: roundObj.roundingAdjustment,
      Total: grandTotal,
      Payment_Method: paymentMethod,
      Payment_Status: paymentStatus,
      Payment_Ref: paymentReference,
      Amount_Paid: amountPaid,
      Change_Amount: changeAmount,
      Refund_Status: 'NONE',
      Refunded_Amount: 0,
      Refund_Reason: '',
      Notes: notes,
      Shift_Session_ID: shiftSessionId,
      COGS_Total: totalCogs
    });

    // 5. Simpan Pembayaran ke Payments & Hitung Penjualan Tunai (Cash) untuk Rekonsiliasi Laci Shift
    // Penting: Transaksi QRIS dan Transfer TIDAK dihitung sebagai uang tunai di laci kas!
    let cashInDrawerDelta = 0;
    if (paymentMethod === 'Split Bill' && paymentSplit.length > 0) {
      let remainingChange = changeAmount;
      paymentSplit.forEach(sp => {
        const m = String(sp.method || 'Cash').trim();
        const amt = Number(sp.amount) || 0;
        appendObjectRow('Payments', {
          Payment_ID: generateId('PAY'),
          Tx_ID: txId,
          Timestamp: now,
          Method: m,
          Amount: amt,
          Reference: String(sp.reference || ''),
          Status: paymentStatus,
          Verified_By: sessionUser.username,
          Verified_At: now
        });
        if (m === 'Cash') {
          const netCash = Math.max(0, amt - remainingChange);
          remainingChange = Math.max(0, remainingChange - amt);
          cashInDrawerDelta += netCash;
        }
      });
    } else {
      appendObjectRow('Payments', {
        Payment_ID: generateId('PAY'),
        Tx_ID: txId,
        Timestamp: now,
        Method: paymentMethod,
        Amount: grandTotal,
        Reference: paymentReference,
        Status: paymentStatus,
        Verified_By: sessionUser.username,
        Verified_At: now
      });
      if (paymentMethod === 'Cash') {
        cashInDrawerDelta = grandTotal;
      }
    }

    // 6. Update Kas Tunai di Shift_Sessions & Cash_Management hanya jika ada pembayaran Cash
    if (openShift && cashInDrawerDelta > 0) {
      const prevCashSales = Number(openShift.Cash_Sales) || 0;
      const newCashSales = prevCashSales + cashInDrawerDelta;
      const openingCash = Number(openShift.Opening_Cash) || 0;
      const cashRefunds = Number(openShift.Cash_Refunds) || 0;
      const cashExpenses = Number(openShift.Cash_Expenses) || 0;
      const expectedCash = openingCash + newCashSales - cashRefunds - cashExpenses;

      updateObjectRow('Shift_Sessions', openShift._rowIndex, {
        Cash_Sales: newCashSales,
        Expected_Cash: expectedCash
      });

      appendObjectRow('Cash_Management', {
        Cash_Log_ID: generateId('CSH'),
        Timestamp: now,
        Session_ID: openShift.Session_ID,
        Username: sessionUser.username,
        Type: 'CASH_SALE',
        Amount: cashInDrawerDelta,
        Reference_ID: txId,
        Notes: `Penjualan tunai ${txId}`
      });
    }

    // 7. Update Poin & Total Belanja Member
    if (memberRow) {
      const prevPoints = Number(memberRow.Points) || 0;
      const newPoints = Math.max(0, prevPoints - pointsRedeemed + pointsEarned);
      const newTotalSpent = (Number(memberRow.Total_Spent) || 0) + grandTotal;
      const newVisits = (Number(memberRow.Visit_Count) || 0) + 1;
      const newTier = calculateMemberTier(newTotalSpent);

      updateObjectRow('Members', memberRow._rowIndex, {
        Points: newPoints,
        Total_Spent: newTotalSpent,
        Visit_Count: newVisits,
        Tier: newTier,
        Last_Visit: now
      });

      if (pointsRedeemed > 0) {
        appendObjectRow('Point_History', {
          Log_ID: generateId('PTS'),
          Timestamp: now,
          Member_ID: memberRow.Member_ID,
          Tx_ID: txId,
          Type: 'REDEEM',
          Points: -pointsRedeemed,
          Balance_After: prevPoints - pointsRedeemed,
          Notes: `Tukar poin potongan Rp ${pointDiscount}`,
          Actor: sessionUser.username
        });
      }
      if (pointsEarned > 0) {
        appendObjectRow('Point_History', {
          Log_ID: generateId('PTS'),
          Timestamp: now,
          Member_ID: memberRow.Member_ID,
          Tx_ID: txId,
          Type: 'EARN',
          Points: pointsEarned,
          Balance_After: newPoints,
          Notes: `Perolehan poin belanja ${txId}`,
          Actor: sessionUser.username
        });
      }
    }

    const receiptObj = {
      txId: txId,
      id: txId,
      timestamp: now,
      dateStr: now,
      cashier: sessionUser.fullName || sessionUser.username,
      orderType: orderType,
      tableNumber: tableNumber,
      memberName: memberRow ? memberRow.Name : '',
      items: verifiedItems,
      itemsSummary: itemsSummary,
      subtotal: subtotal,
      discountAmount: totalDiscount,
      pointsRedeemed: pointsRedeemed,
      pointDiscount: pointDiscount,
      pointsEarned: pointsEarned,
      taxName: taxName,
      taxRate: taxRate,
      taxMode: taxMode,
      taxAmount: taxAmount,
      roundingAdjustment: roundObj.roundingAdjustment,
      grandTotal: grandTotal,
      total: grandTotal,
      paymentMethod: paymentMethod,
      method: paymentMethod,
      paymentStatus: paymentStatus,
      paymentReference: paymentReference,
      paymentSplit: paymentSplit,
      amountPaid: amountPaid,
      changeAmount: changeAmount,
      notes: notes,
      storeName: settings.store_name || 'UsahaOS',
      storeTagline: settings.store_tagline || 'Specialty Coffee & Collaborative Space',
      storeAddress: settings.store_address || '',
      storePhone: settings.store_phone || '',
      footerText: settings.receipt_footer || 'Terima kasih telah berkunjung!'
    };

    logActivity(sessionUser.username, sessionUser.role, 'CHECKOUT_TX', txId, `${paymentMethod} - Rp ${grandTotal}`);
    return {
      success: true,
      txId: txId,
      total: grandTotal,
      grandTotal: grandTotal,
      receipt: receiptObj
    };
  } finally {
    lock.releaseLock();
  }
}

function getTransactionReceipt(txId) {
  const id = String(txId || '').trim();
  if (!id) return { error: 'ID Transaksi wajib diisi.' };
  const txs = readSheetObjects('Transactions');
  const t = txs.find(x => String(x.Tx_ID || '') === id);
  if (!t) return { error: 'Transaksi tidak ditemukan.' };

  const settings = getSettingsMap();
  let items = [];
  try {
    items = JSON.parse(t.Items_JSON || '[]');
  } catch (e) {
    items = [];
  }

  const receipt = {
    txId: String(t.Tx_ID || ''),
    id: String(t.Tx_ID || ''),
    timestamp: formatTimestampWIB(t.Timestamp),
    dateStr: formatTimestampWIB(t.Timestamp),
    cashier: String(t.Cashier || ''),
    orderType: String(t.Order_Type || 'Dine In'),
    tableNumber: String(t.Table_Number || ''),
    memberName: String(t.Customer_Name || ''),
    items: items,
    itemsSummary: String(t.Items_Summary || ''),
    subtotal: Number(t.Subtotal) || 0,
    discountAmount: Number(t.Discount_Amount) || 0,
    taxRate: Number(t.Tax_Rate) || 0,
    taxMode: String(t.Tax_Mode || 'EXCLUSIVE'),
    taxAmount: Number(t.Tax_Amount) || 0,
    roundingAdjustment: Number(t.Rounding_Amount) || 0,
    grandTotal: Number(t.Total) || 0,
    total: Number(t.Total) || 0,
    paymentMethod: String(t.Payment_Method || 'Cash'),
    method: String(t.Payment_Method || 'Cash'),
    paymentStatus: String(t.Payment_Status || 'Berhasil'),
    amountPaid: Number(t.Amount_Paid) || Number(t.Total) || 0,
    changeAmount: Number(t.Change_Amount) || 0,
    pointsEarned: Number(t.Points_Earned) || 0,
    notes: String(t.Notes || ''),
    storeName: settings.store_name || 'UsahaOS',
    storeTagline: settings.store_tagline || '',
    storeAddress: settings.store_address || '',
    storePhone: settings.store_phone || '',
    footerText: settings.receipt_footer || ''
  };
  return { success: true, txId: id, receipt: receipt };
}

function getCashierRecentTransactions(sessionUser) {
  const today = todayStr();
  const rows = readSheetObjects('Transactions');
  const recent = rows.filter(t => normalizeDateWIB(t.Date_WIB || t.Timestamp) === today)
    .reverse()
    .slice(0, 50)
    .map(t => {
      let items = [];
      try { items = JSON.parse(t.Items_JSON || '[]'); } catch (e) {}
      return {
        id: String(t.Tx_ID || ''),
        txId: String(t.Tx_ID || ''),
        dateStr: formatTimestampWIB(t.Timestamp),
        timestamp: formatTimestampWIB(t.Timestamp),
        cashier: String(t.Cashier || ''),
        orderType: String(t.Order_Type || 'Dine In'),
        tableNumber: String(t.Table_Number || ''),
        items: items,
        itemsSummary: String(t.Items_Summary || ''),
        subtotal: Number(t.Subtotal) || 0,
        discountAmount: Number(t.Discount_Amount) || 0,
        taxAmount: Number(t.Tax_Amount) || 0,
        roundingAdjustment: Number(t.Rounding_Amount) || 0,
        total: Number(t.Total) || 0,
        grandTotal: Number(t.Total) || 0,
        method: String(t.Payment_Method || 'Cash'),
        paymentMethod: String(t.Payment_Method || 'Cash'),
        amountPaid: Number(t.Amount_Paid) || Number(t.Total) || 0,
        changeAmount: Number(t.Change_Amount) || 0,
        status: String(t.Refund_Status) === 'FULL' ? 'Refunded' : (String(t.Refund_Status) === 'PARTIAL' ? 'Partial Refund' : String(t.Payment_Status || 'Berhasil'))
      };
    });
  return { success: true, transactions: recent };
}

// ============================================================================
// 12. KEUANGAN, VERIFIKASI PEMBAYARAN & REFUND TRANSAKSI
// ============================================================================
function getFinanceData(payload) {
  const startDate = normalizeDateWIB(payload && payload.startDate);
  const endDate = normalizeDateWIB(payload && payload.endDate);

  const txRows = readSheetObjects('Transactions');
  let grossRevenue = 0;
  let totalRefund = 0;
  let txCount = 0;
  let refundCount = 0;
  const paymentBreakdown = {};

  const filtered = [];
  for (let i = txRows.length - 1; i >= 0; i--) {
    const t = txRows[i];
    const dStr = normalizeDateWIB(t.Date_WIB || t.Timestamp);
    if (startDate && dStr < startDate) continue;
    if (endDate && dStr > endDate) continue;

    const total = Number(t.Total) || 0;
    const refundedAmt = Number(t.Refunded_Amount) || 0;
    const refStatus = String(t.Refund_Status || 'NONE').toUpperCase();
    const payStatus = String(t.Payment_Status || 'Berhasil');
    const method = String(t.Payment_Method || 'Cash');

    let displayStatus = payStatus;
    if (refStatus === 'FULL' || (refundedAmt >= total && total > 0)) {
      displayStatus = 'Refunded';
    } else if (refStatus === 'PARTIAL' || refundedAmt > 0) {
      displayStatus = 'Partial Refund';
    }

    grossRevenue += total;
    totalRefund += refundedAmt;
    if (displayStatus !== 'Refunded') txCount++;
    if (refundedAmt > 0 || displayStatus === 'Refunded') refundCount++;

    const netTx = Math.max(0, total - refundedAmt);
    paymentBreakdown[method] = (paymentBreakdown[method] || 0) + netTx;

    let items = [];
    try { items = JSON.parse(t.Items_JSON || '[]'); } catch (e) {}

    filtered.push({
      id: String(t.Tx_ID || ''),
      txId: String(t.Tx_ID || ''),
      dateStr: formatTimestampWIB(t.Timestamp),
      timestamp: formatTimestampWIB(t.Timestamp),
      dateWib: dStr,
      cashier: String(t.Cashier || ''),
      orderType: String(t.Order_Type || 'Dine In'),
      tableNumber: String(t.Table_Number || ''),
      method: method,
      paymentMethod: method,
      status: displayStatus,
      paymentStatus: payStatus,
      items: items,
      itemsSummary: String(t.Items_Summary || ''),
      subtotal: Number(t.Subtotal) || total,
      discountAmount: Number(t.Discount_Amount) || 0,
      taxAmount: Number(t.Tax_Amount) || 0,
      roundingAdjustment: Number(t.Rounding_Amount) || 0,
      grossTotal: total,
      refundAmount: refundedAmt,
      refundReason: String(t.Refund_Reason || ''),
      total: netTx,
      grandTotal: total,
      amountPaid: Number(t.Amount_Paid) || total,
      changeAmount: Number(t.Change_Amount) || 0,
      notes: String(t.Notes || '')
    });
  }

  const netRevenue = Math.max(0, grossRevenue - totalRefund);
  return {
    success: true,
    transactions: filtered,
    summary: {
      grossRevenue: grossRevenue,
      totalRefund: totalRefund,
      netRevenue: netRevenue,
      txCount: txCount,
      refundCount: refundCount,
      paymentBreakdown: paymentBreakdown
    }
  };
}

function verifyTransactionPayment(payload, sessionUser) {
  const txId = String(payload.txId || '').trim();
  const newStatus = String(payload.newStatus || 'Berhasil').trim();
  if (!txId) return { error: 'ID Transaksi wajib diisi.' };

  const txRows = readSheetObjects('Transactions');
  const target = txRows.find(t => String(t.Tx_ID || '') === txId);
  if (!target) return { error: 'Transaksi tidak ditemukan.' };

  updateObjectRow('Transactions', target._rowIndex, { Payment_Status: newStatus });

  const payRows = readSheetObjects('Payments').filter(p => String(p.Tx_ID || '') === txId);
  const now = nowStr();
  payRows.forEach(p => {
    updateObjectRow('Payments', p._rowIndex, {
      Status: newStatus,
      Verified_By: sessionUser.username,
      Verified_At: now
    });
  });

  logActivity(sessionUser.username, sessionUser.role, 'VERIFY_PAYMENT', txId, newStatus);
  return { success: true };
}

function processRefund(payload, sessionUser) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    return { error: 'Sistem sibuk memproses refund lain. Silakan coba lagi.' };
  }

  try {
    const txId = String(payload.txId || '').trim();
    const reason = String(payload.reason || '').trim();
    const isFullRefund = payload.isFullRefund === true || String(payload.isFullRefund).toLowerCase() === 'true';
    const reqItems = Array.isArray(payload.refundItems) ? payload.refundItems : [];
    const externalStatus = String(payload.externalRefundStatus || 'Dana Sudah Dikembalikan').trim();

    if (!txId) return { error: 'ID Transaksi wajib diisi.' };
    if (!reason) return { error: 'Alasan refund wajib diisi untuk keperluan audit.' };

    const txRows = readSheetObjects('Transactions');
    const txTarget = txRows.find(t => String(t.Tx_ID || '') === txId);
    if (!txTarget) return { error: 'Transaksi tidak ditemukan.' };

    if (String(txTarget.Refund_Status || '').toUpperCase() === 'FULL') {
      return { error: 'Transaksi ini sudah di-refund penuh sebelumnya.' };
    }

    const grossTotal = Number(txTarget.Total) || 0;
    const prevRefunded = Number(txTarget.Refunded_Amount) || 0;
    const maxRefundableMoney = Math.max(0, grossTotal - prevRefunded);
    if (maxRefundableMoney <= 0) {
      return { error: 'Tidak ada sisa nominal yang dapat di-refund pada transaksi ini.' };
    }

    let items = [];
    try { items = JSON.parse(txTarget.Items_JSON || '[]'); } catch (e) {}

    const prodRows = readSheetObjects('Products');
    const prodMap = {};
    prodRows.forEach(p => { prodMap[String(p.Product_ID || '')] = p; });

    const matRows = readSheetObjects('Materials');
    const matMap = {};
    matRows.forEach(m => { matMap[String(m.Material_ID || '')] = m; });

    const bomRows = readSheetObjects('BOM');
    const bomByProd = {};
    bomRows.forEach(b => {
      const pid = String(b.Product_ID || '');
      if (!bomByProd[pid]) bomByProd[pid] = [];
      bomByProd[pid].push(b);
    });

    const now = nowStr();
    const dateWib = todayStr();
    let refundMoneyCalc = 0;
    const refundedItemsSnapshot = [];

    items.forEach(item => {
      const pid = String(item.id || item.productId || '');
      const origQty = Number(item.qty) || 0;
      const alreadyRef = Number(item.refundedQty) || 0;
      const remQty = Math.max(0, origQty - alreadyRef);
      if (remQty <= 0) return;

      const matchReq = reqItems.find(r => String(r.id || r.productId || '') === pid);
      let refQty = isFullRefund ? remQty : (matchReq ? Math.floor(Number(matchReq.qty) || 0) : 0);
      if (refQty <= 0) return;
      if (refQty > remQty) refQty = remQty;

      const stockMode = matchReq && matchReq.returnStockMode ? String(matchReq.returnStockMode).toUpperCase() : 'PRODUCT';
      const unitPrice = Number(item.unitPrice || item.price) || 0;
      item.refundedQty = alreadyRef + refQty;
      refundMoneyCalc += unitPrice * refQty;

      refundedItemsSnapshot.push({
        productId: pid,
        name: item.name || item.productName,
        qty: refQty,
        unitPrice: unitPrice,
        returnStockMode: stockMode
      });

      // Pemulihan stok berdasarkan mode yang dipilih tanpa double-restore
      if (stockMode === 'PRODUCT' && prodMap[pid]) {
        const pRow = prodMap[pid];
        const prev = Number(pRow.Stock) || 0;
        const next = prev + refQty;
        updateObjectRow('Products', pRow._rowIndex, { Stock: next, Updated_At: now });
        appendObjectRow('Stock_Movements', {
          Movement_ID: generateId('MOV'),
          Timestamp: now,
          Item_Type: 'PRODUCT',
          Item_ID: pid,
          Item_Name: pRow.Name,
          Type: 'REFUND_IN',
          Qty: refQty,
          Unit: 'pcs',
          Prev_Stock: prev,
          New_Stock: next,
          Unit_Cost: Number(pRow.Cost) || 0,
          Reference_ID: txId,
          Notes: `Pengembalian stok produk dari refund ${txId}`,
          Actor: sessionUser.username
        });
      } else if (stockMode === 'BOM') {
        const pBoms = bomByProd[pid] || [];
        pBoms.forEach(b => {
          const mid = String(b.Material_ID || '');
          const mRow = matMap[mid];
          if (mRow) {
            const restoreQty = Number((convertUnitQty(Number(b.Qty) || 0, b.Unit || mRow.Unit, mRow.Unit) * refQty).toFixed(2));
            const prevM = Number(mRow.Stock) || 0;
            const nextM = Number((prevM + restoreQty).toFixed(2));
            updateObjectRow('Materials', mRow._rowIndex, { Stock: nextM, Updated_At: now });
            appendObjectRow('Stock_Movements', {
              Movement_ID: generateId('MOV'),
              Timestamp: now,
              Item_Type: 'MATERIAL',
              Item_ID: mid,
              Item_Name: mRow.Name,
              Type: 'REFUND_BOM_IN',
              Qty: restoreQty,
              Unit: mRow.Unit,
              Prev_Stock: prevM,
              New_Stock: nextM,
              Unit_Cost: Number(mRow.Cost_Per_Unit) || 0,
              Reference_ID: txId,
              Notes: `Pengembalian bahan BOM dari refund ${txId}`,
              Actor: sessionUser.username
            });
          }
        });
      }
    });

    if (refundedItemsSnapshot.length === 0) {
      return { error: 'Pilih minimal 1 item dengan jumlah refund yang valid.' };
    }

    const allReturned = items.every(it => (Number(it.refundedQty) || 0) >= (Number(it.qty) || 0));
    const finalRefundAmount = (isFullRefund || allReturned)
      ? maxRefundableMoney
      : Math.min(maxRefundableMoney, refundMoneyCalc);

    const newTotalRefunded = prevRefunded + finalRefundAmount;
    const newRefundStatus = (allReturned || newTotalRefunded >= grossTotal) ? 'FULL' : 'PARTIAL';

    updateObjectRow('Transactions', txTarget._rowIndex, {
      Items_JSON: JSON.stringify(items),
      Refund_Status: newRefundStatus,
      Refunded_Amount: newTotalRefunded,
      Refund_Reason: reason
    });

    // Update Transaction_Items Refunded_Qty
    const txItemRows = readSheetObjects('Transaction_Items').filter(r => String(r.Tx_ID || '') === txId);
    txItemRows.forEach(r => {
      const pid = String(r.Product_ID || '');
      const snap = items.find(it => String(it.id || it.productId || '') === pid);
      if (snap) {
        updateObjectRow('Transaction_Items', r._rowIndex, { Refunded_Qty: snap.refundedQty || 0 });
      }
    });

    // Jika transaksi dibayar dengan Cash, kurangi kas di sesi shift aktif
    const paymentMethod = String(txTarget.Payment_Method || 'Cash');
    const shiftSessions = readSheetObjects('Shift_Sessions');
    const openShift = shiftSessions.find(s => String(s.Status || '').toUpperCase() === 'OPEN');

    if (openShift && paymentMethod === 'Cash') {
      const prevRef = Number(openShift.Cash_Refunds) || 0;
      const nextRef = prevRef + finalRefundAmount;
      const expected = (Number(openShift.Opening_Cash) || 0) + (Number(openShift.Cash_Sales) || 0) - nextRef - (Number(openShift.Cash_Expenses) || 0);
      updateObjectRow('Shift_Sessions', openShift._rowIndex, {
        Cash_Refunds: nextRef,
        Expected_Cash: expected
      });

      appendObjectRow('Cash_Management', {
        Cash_Log_ID: generateId('CSH'),
        Timestamp: now,
        Session_ID: openShift.Session_ID,
        Username: sessionUser.username,
        Type: 'CASH_REFUND',
        Amount: -finalRefundAmount,
        Reference_ID: txId,
        Notes: `Refund tunai ${txId}: ${reason}`
      });
    }

    const refundId = generateId('REF');
    appendObjectRow('Refunds', {
      Refund_ID: refundId,
      Tx_ID: txId,
      Timestamp: now,
      Date_WIB: dateWib,
      Actor: sessionUser.username,
      Refund_Type: newRefundStatus,
      Refund_Amount: finalRefundAmount,
      Payment_Method: paymentMethod,
      Reason: reason,
      Restore_Stock_Mode: refundedItemsSnapshot.map(x => x.returnStockMode).join(','),
      Items_JSON: JSON.stringify(refundedItemsSnapshot),
      External_Status: externalStatus,
      Shift_Session_ID: openShift ? openShift.Session_ID : ''
    });

    logActivity(sessionUser.username, sessionUser.role, 'PROCESS_REFUND', txId, `${newRefundStatus} - Rp ${finalRefundAmount} (${reason})`);
    return {
      success: true,
      refundId: refundId,
      refundedAmount: finalRefundAmount,
      refundStatus: newRefundStatus
    };
  } finally {
    lock.releaseLock();
  }
}

// ============================================================================
// 13. EXECUTIVE DASHBOARD ANALYTICS & TAB RINGKASAN AI
// ============================================================================
function getDashboardAnalytics(payload) {
  const startDate = normalizeDateWIB(payload && payload.startDate);
  const endDate = normalizeDateWIB(payload && payload.endDate);
  const today = todayStr();

  const txRows = readSheetObjects('Transactions');
  const products = getProductsWithEffectiveStock(true);
  const materials = getMaterialsList(false);

  const prodCatMap = {};
  const productAgg = {};
  products.forEach(p => {
    prodCatMap[p.id] = p.category || 'Umum';
    productAgg[p.name] = { id: p.id, name: p.name, category: p.category || 'Umum', qty: 0, revenue: 0 };
  });

  let todayGross = 0;
  let grossRevenue = 0;
  let refundTotal = 0;
  let totalDiscount = 0;
  let totalCogs = 0;
  let txCount = 0;
  let refundCount = 0;

  const dailyMap = {};
  const paymentStats = {};
  const categoryStats = {};
  const cashierMap = {};

  txRows.forEach(t => {
    const dStr = normalizeDateWIB(t.Date_WIB || t.Timestamp);
    const gross = Number(t.Total) || 0;
    const refunded = Number(t.Refunded_Amount) || 0;
    const net = Math.max(0, gross - refunded);
    const refStatus = String(t.Refund_Status || 'NONE').toUpperCase();

    if (dStr === today) {
      todayGross += net;
    }

    if (startDate && dStr < startDate) return;
    if (endDate && dStr > endDate) return;

    grossRevenue += gross;
    refundTotal += refunded;
    totalDiscount += (Number(t.Discount_Amount) || 0);
    totalCogs += (Number(t.COGS_Total) || 0);

    if (refStatus !== 'FULL') txCount++;
    if (refunded > 0 || refStatus === 'FULL') refundCount++;

    if (dStr) {
      if (!dailyMap[dStr]) dailyMap[dStr] = { date: dStr, total: 0, count: 0 };
      dailyMap[dStr].total += net;
      dailyMap[dStr].count += 1;
    }

    const method = String(t.Payment_Method || 'Cash');
    paymentStats[method] = (paymentStats[method] || 0) + net;

    const cashier = String(t.Cashier || 'kasir');
    if (!cashierMap[cashier]) cashierMap[cashier] = { name: cashier, count: 0, total: 0 };
    if (refStatus !== 'FULL') {
      cashierMap[cashier].count += 1;
      cashierMap[cashier].total += net;
    }

    let items = [];
    try { items = JSON.parse(t.Items_JSON || '[]'); } catch (e) {}
    items.forEach(it => {
      const pName = String(it.name || it.productName || 'Produk');
      const pid = String(it.id || it.productId || '');
      const netQty = Math.max(0, (Number(it.qty) || 0) - (Number(it.refundedQty) || 0));
      const lineRev = netQty * (Number(it.unitPrice || it.price) || 0);
      const cat = it.category || prodCatMap[pid] || 'Umum';

      if (!productAgg[pName]) {
        productAgg[pName] = { id: pid, name: pName, category: cat, qty: 0, revenue: 0 };
      }
      productAgg[pName].qty += netQty;
      productAgg[pName].revenue += lineRev;

      categoryStats[cat] = (categoryStats[cat] || 0) + lineRev;
    });
  });

  const netRevenue = Math.max(0, grossRevenue - refundTotal);
  const avgOrderValue = txCount > 0 ? Math.round(netRevenue / txCount) : 0;
  const dailyTrend = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

  const allProdStats = Object.values(productAgg);
  const top5Products = [...allProdStats].sort((a, b) => b.qty - a.qty || b.revenue - a.revenue).slice(0, 5);
  const bottom5Products = [...allProdStats].sort((a, b) => a.qty - b.qty || a.revenue - b.revenue).slice(0, 5);

  const lowStockProducts = products.filter(p => p.isActive && p.effectiveStock <= p.minStock);
  const lowStockMaterials = materials.filter(m => m.isActive && m.stock <= m.minStock);

  return {
    success: true,
    summary: {
      todayStr: today,
      todayGross: todayGross,
      grossRevenue: grossRevenue,
      netRevenue: netRevenue,
      refundTotal: refundTotal,
      refundCount: refundCount,
      totalDiscount: totalDiscount,
      totalCogs: totalCogs,
      grossProfit: Math.max(0, netRevenue - totalCogs),
      txCount: txCount,
      avgOrderValue: avgOrderValue
    },
    dailyTrend: dailyTrend,
    paymentStats: paymentStats,
    categoryStats: categoryStats,
    top5Products: top5Products,
    bottom5Products: bottom5Products,
    lowStockProducts: lowStockProducts,
    lowStockMaterials: lowStockMaterials,
    cashierStats: Object.values(cashierMap).sort((a, b) => b.total - a.total)
  };
}

/**
 * Fungsi untuk merangkum & memperbarui seluruh 5 tab ringkasan analitik AI:
 * Daily_Summary, Product_Summary, Payment_Summary, Inventory_Summary, dan Shift_Summary.
 * Dapat dijalankan langsung dari Editor Google Apps Script, dari tombol "Sinkronkan Data" di Web App,
 * maupun otomatis dipanggil setiap kali AI ditanya atau terjadi transaksi.
 */
function refreshAnalyticsSummaries() {
  const dash = getDashboardAnalytics({});
  const now = nowStr();
  const ss = getDB();

  const txRows = readSheetObjects('Transactions');
  const products = getProductsWithEffectiveStock(true);
  const materials = getMaterialsList(false);
  const shiftSessions = readSheetObjects('Shift_Sessions');

  // 1. Perbarui Daily_Summary
  const dailySheet = ensureSheetExists(ss, 'Daily_Summary', SCHEMA.Daily_Summary);
  if (dailySheet.getLastRow() > 1) {
    dailySheet.getRange(2, 1, dailySheet.getLastRow() - 1, dailySheet.getLastColumn()).clearContent();
  }
  const dailyAgg = {};
  txRows.forEach(t => {
    const dStr = normalizeDateWIB(t.Date_WIB || t.Timestamp);
    if (!dStr) return;
    if (!dailyAgg[dStr]) {
      dailyAgg[dStr] = { txCount: 0, gross: 0, discount: 0, tax: 0, refund: 0, net: 0, cogs: 0 };
    }
    const gross = Number(t.Total) || 0;
    const refunded = Number(t.Refunded_Amount) || 0;
    const net = Math.max(0, gross - refunded);
    const refStatus = String(t.Refund_Status || 'NONE').toUpperCase();
    if (refStatus !== 'FULL') dailyAgg[dStr].txCount += 1;
    dailyAgg[dStr].gross += gross;
    dailyAgg[dStr].discount += (Number(t.Discount_Amount) || 0);
    dailyAgg[dStr].tax += (Number(t.Tax_Amount) || 0);
    dailyAgg[dStr].refund += refunded;
    dailyAgg[dStr].net += net;
    dailyAgg[dStr].cogs += (Number(t.COGS_Total) || 0);
  });
  Object.keys(dailyAgg).sort().forEach(dStr => {
    const d = dailyAgg[dStr];
    appendObjectRow('Daily_Summary', {
      Date_WIB: dStr,
      Tx_Count: d.txCount,
      Gross_Sales: d.gross,
      Discount_Total: d.discount,
      Tax_Total: d.tax,
      Refund_Total: d.refund,
      Net_Sales: d.net,
      COGS_Total: d.cogs,
      Gross_Profit: Math.max(0, d.net - d.cogs),
      Updated_At: now
    });
  });

  // 2. Perbarui Product_Summary (Semua produk)
  const prodSheet = ensureSheetExists(ss, 'Product_Summary', SCHEMA.Product_Summary);
  if (prodSheet.getLastRow() > 1) {
    prodSheet.getRange(2, 1, prodSheet.getLastRow() - 1, prodSheet.getLastColumn()).clearContent();
  }
  const prodFullMap = {};
  products.forEach(p => {
    prodFullMap[p.id] = {
      id: p.id, name: p.name, category: p.category || 'Umum',
      qtySold: 0, refundedQty: 0, netQty: 0, grossRev: 0, totalCogs: 0, unitCost: Number(p.cost) || 0
    };
  });
  txRows.forEach(t => {
    let items = [];
    try { items = JSON.parse(t.Items_JSON || '[]'); } catch (e) {}
    items.forEach(it => {
      const pid = String(it.id || it.productId || '');
      const pName = String(it.name || it.productName || 'Produk');
      const key = prodFullMap[pid] ? pid : pName;
      if (!prodFullMap[key]) {
        prodFullMap[key] = {
          id: pid || '-', name: pName, category: it.category || 'Umum',
          qtySold: 0, refundedQty: 0, netQty: 0, grossRev: 0, totalCogs: 0, unitCost: Number(it.unitCost) || 0
        };
      }
      const q = Number(it.qty) || 0;
      const rq = Number(it.refundedQty) || 0;
      const nq = Math.max(0, q - rq);
      const uPrice = Number(it.unitPrice || it.price) || 0;
      const uCost = Number(it.unitCost) || prodFullMap[key].unitCost || 0;
      prodFullMap[key].qtySold += q;
      prodFullMap[key].refundedQty += rq;
      prodFullMap[key].netQty += nq;
      prodFullMap[key].grossRev += (nq * uPrice);
      prodFullMap[key].totalCogs += (nq * uCost);
    });
  });
  Object.values(prodFullMap).forEach(p => {
    appendObjectRow('Product_Summary', {
      Product_ID: p.id || '-',
      Product_Name: p.name,
      Category: p.category || '-',
      Qty_Sold: p.qtySold,
      Refunded_Qty: p.refundedQty,
      Net_Qty: p.netQty,
      Gross_Revenue: p.grossRev,
      Total_COGS: p.totalCogs,
      Gross_Profit: Math.max(0, p.grossRev - p.totalCogs),
      Updated_At: now
    });
  });

  // 3. Perbarui Payment_Summary
  const paySheet = ensureSheetExists(ss, 'Payment_Summary', SCHEMA.Payment_Summary);
  if (paySheet.getLastRow() > 1) {
    paySheet.getRange(2, 1, paySheet.getLastRow() - 1, paySheet.getLastColumn()).clearContent();
  }
  const payAgg = {};
  txRows.forEach(t => {
    const m = String(t.Payment_Method || 'Cash');
    if (!payAgg[m]) payAgg[m] = { count: 0, gross: 0, refund: 0, net: 0 };
    const gross = Number(t.Total) || 0;
    const ref = Number(t.Refunded_Amount) || 0;
    payAgg[m].count += 1;
    payAgg[m].gross += gross;
    payAgg[m].refund += ref;
    payAgg[m].net += Math.max(0, gross - ref);
  });
  Object.keys(payAgg).forEach(method => {
    const pm = payAgg[method];
    appendObjectRow('Payment_Summary', {
      Payment_Method: method,
      Tx_Count: pm.count,
      Gross_Amount: pm.gross,
      Refund_Amount: pm.refund,
      Net_Amount: pm.net,
      Updated_At: now
    });
  });

  // 4. Perbarui Inventory_Summary
  const invSheet = ensureSheetExists(ss, 'Inventory_Summary', SCHEMA.Inventory_Summary);
  if (invSheet.getLastRow() > 1) {
    invSheet.getRange(2, 1, invSheet.getLastRow() - 1, invSheet.getLastColumn()).clearContent();
  }
  materials.forEach(m => {
    let status = 'SAFE';
    if (m.stock <= 0) status = 'OUT_OF_STOCK';
    else if (m.stock <= m.minStock) status = 'LOW_STOCK';
    appendObjectRow('Inventory_Summary', {
      Material_ID: m.id,
      Material_Name: m.name,
      Unit: m.unit,
      Current_Stock: m.stock,
      Min_Stock: m.minStock,
      Status: status,
      Stock_Value: Math.round((Number(m.stock) || 0) * (Number(m.costPerUnit) || 0)),
      Updated_At: now
    });
  });

  // 5. Perbarui Shift_Summary
  const shiftSumSheet = ensureSheetExists(ss, 'Shift_Summary', SCHEMA.Shift_Summary);
  if (shiftSumSheet.getLastRow() > 1) {
    shiftSumSheet.getRange(2, 1, shiftSumSheet.getLastRow() - 1, shiftSumSheet.getLastColumn()).clearContent();
  }
  shiftSessions.forEach(s => {
    appendObjectRow('Shift_Summary', {
      Session_ID: s.Session_ID,
      Username: s.Username,
      Open_Time: formatTimestampWIB(s.Open_Time),
      Close_Time: formatTimestampWIB(s.Close_Time),
      Opening_Cash: Number(s.Opening_Cash) || 0,
      Cash_Sales: Number(s.Cash_Sales) || 0,
      Expected_Cash: Number(s.Expected_Cash) || 0,
      Actual_Cash: Number(s.Actual_Cash) || 0,
      Difference: Number(s.Difference) || 0,
      Status: s.Status || 'OPEN'
    });
  });

  return { success: true, updatedAt: now };
}

/**
 * Fungsi untuk memasang Trigger Otomatis (Time-Driven setiap 15 menit & saat ada perubahan)
 * di Google Apps Script agar tab ringkasan AI selalu ter-update otomatis di belakang layar.
 * Jalankan fungsi ini 1 kali dari Editor Google Apps Script jika diinginkan.
 */
function setupAutoUpdateAITrigger() {
  const existingTriggers = ScriptApp.getProjectTriggers();
  existingTriggers.forEach(t => {
    if (t.getHandlerFunction() === 'refreshAnalyticsSummaries') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('refreshAnalyticsSummaries')
    .timeBased()
    .everyMinutes(15)
    .create();
  return {
    success: true,
    message: 'Trigger otomatis refreshAnalyticsSummaries berhasil dipasang (berjalan otomatis setiap 15 menit).'
  };
}

/**
 * Fungsi yang merangkup (mengagregasi) SELURUH data live dari semua tab Google Sheets
 * sehingga ketika AI ditanya tentang apa saja (penjualan, tanggal tertentu, produk, resep BOM,
 * stok bahan baku, modifier, diskon, member, shift, kas, atau refund), AI memiliki data lengkap & real-time.
 */
function buildFullAIContextData(sessionUser) {
  // Sinkronkan juga tab summary agar spreadsheet selalu punya ringkasan terbaru
  try { refreshAnalyticsSummaries(); } catch (e) {}

  const dash = getDashboardAnalytics({});
  const shiftInfo = getActiveShiftSession(sessionUser);
  const products = getProductsWithEffectiveStock(true);
  const materials = getMaterialsList(true);
  const bomRows = readSheetObjects('BOM');
  const modGroups = getModifierGroupsList(true);
  const modifiers = getModifiersList(true);
  const discounts = getDiscountsList(true);
  const members = readSheetObjects('Members');
  const txRows = readSheetObjects('Transactions');
  const refundRows = readSheetObjects('Refunds');
  const shiftSessions = readSheetObjects('Shift_Sessions');
  const stockMovements = readSheetObjects('Stock_Movements');

  const s = dash.summary;

  return {
    waktuUpdateRealTimeWIB: nowStr(),
    tanggalHariIni: s.todayStr,
    omzetBersihHariIni: s.todayGross,
    ringkasanKeuanganKeseluruhan: {
      pendapatanKotor: s.grossRevenue,
      totalDiskonDiberikan: s.totalDiscount,
      totalRefund: s.refundTotal,
      jumlahTransaksiRefund: s.refundCount,
      pendapatanBersih: s.netRevenue,
      estimasiTotalHPP: s.totalCogs,
      labaKotor: s.grossProfit,
      jumlahTransaksiBerhasil: s.txCount,
      rataRataNilaiTransaksi: s.avgOrderValue
    },
    trenPenjualanHarian: dash.dailyTrend,
    rincianMetodePembayaran: dash.paymentStats,
    penjualanPerKategori: dash.categoryStats,
    produkTerlarisTop5: dash.top5Products,
    produkTerendahBottom5: dash.bottom5Products,
    daftarSemuaProdukDanStokEfektif: products.map(p => ({
      id: p.id,
      sku: p.sku,
      nama: p.name,
      kategori: p.category,
      hargaJual: p.price,
      hpp: p.cost,
      stokMaster: p.stock,
      stokEfektifTersedia: p.effectiveStock,
      minStok: p.minStock,
      pakaiResepBOM: p.useBom,
      aktif: p.isActive
    })),
    daftarSemuaBahanBakuInventori: materials.map(m => ({
      id: m.id,
      sku: m.sku,
      nama: m.name,
      stokSaatIni: m.stock,
      satuan: m.unit,
      minStok: m.minStock,
      hargaBeliPerUnit: m.costPerUnit,
      statusStok: m.stock <= 0 ? 'HABIS' : (m.stock <= m.minStock ? 'MENIPIS' : 'AMAN')
    })),
    resepBOMProduk: bomRows.map(b => ({
      productId: b.Product_ID,
      materialId: b.Material_ID,
      qtyPakai: Number(b.Qty) || 0,
      satuan: b.Unit,
      wastePercent: Number(b.Waste_Percent) || 0
    })),
    konfigurasiModifier: {
      grupModifier: modGroups.map(g => ({
        groupId: g.groupId,
        namaGrup: g.name,
        wajib: g.required,
        kategoriTerkait: g.applicableCategories
      })),
      opsiModifier: modifiers.map(m => ({
        modifierId: m.modifierId,
        namaGrup: m.groupName,
        namaOpsi: m.optionName,
        hargaTambahan: m.price,
        kategoriTerkait: m.applicableCategories
      }))
    },
    daftarDiskonDanPromo: discounts.map(d => ({
      kode: d.code,
      namaPromo: d.title,
      tipe: d.type,
      nilai: d.value,
      minBelanja: d.minPurchase,
      periode: `${d.startDate || '-'} s/d ${d.endDate || '-'}`,
      targetKategori: d.targetCategory,
      aktif: d.isActive
    })),
    ringkasanMemberLoyalitas: {
      totalMemberTerdaftar: members.length,
      daftarMemberTop10: members
        .map(m => ({
          id: m.Member_ID,
          nama: m.Full_Name,
          phone: String(m.Phone || ''),
          tier: m.Tier,
          poin: Number(m.Points) || 0,
          totalBelanja: Number(m.Total_Spent) || 0
        }))
        .sort((a, b) => b.totalBelanja - a.totalBelanja)
        .slice(0, 10)
    },
    performaKasir: dash.cashierStats,
    shiftAktifSaatIni: shiftInfo.activeShift,
    riwayatShiftTerbaru: shiftSessions.slice(-10).map(sh => ({
      sessionId: sh.Session_ID,
      kasir: sh.Username,
      waktuBuka: formatTimestampWIB(sh.Open_Time),
      waktuTutup: formatTimestampWIB(sh.Close_Time),
      modalAwal: Number(sh.Opening_Cash) || 0,
      penjualanCash: Number(sh.Cash_Sales) || 0,
      refundCash: Number(sh.Cash_Refunds) || 0,
      kasDiharapkan: Number(sh.Expected_Cash) || 0,
      kasAktual: Number(sh.Actual_Cash) || 0,
      selisih: Number(sh.Difference) || 0,
      status: sh.Status
    })),
    riwayatTransaksiTerbaru20: txRows.slice(-20).reverse().map(t => ({
      txId: t.Tx_ID,
      waktu: formatTimestampWIB(t.Timestamp),
      tanggal: normalizeDateWIB(t.Date_WIB || t.Timestamp),
      kasir: t.Cashier,
      metodeBayar: t.Payment_Method,
      totalTagihan: Number(t.Total) || 0,
      statusRefund: t.Refund_Status || 'NONE',
      nominalRefund: Number(t.Refunded_Amount) || 0
    })),
    riwayatRefundTerbaru10: refundRows.slice(-10).reverse().map(r => ({
      refundId: r.Refund_ID,
      txId: r.Tx_ID,
      waktu: formatTimestampWIB(r.Timestamp),
      petugas: r.Actor,
      tipe: r.Refund_Type,
      nominal: Number(r.Refund_Amount) || 0,
      alasan: r.Reason
    })),
    mutasiStokTerbaru15: stockMovements.slice(-15).reverse().map(sm => ({
      waktu: formatTimestampWIB(sm.Timestamp),
      item: sm.Entity_Name,
      jenisMutasi: sm.Movement_Type,
      perubahanQty: Number(sm.Qty_Change) || 0,
      satuan: sm.Unit,
      stokAkhir: Number(sm.Balance_After) || 0,
      referensi: sm.Reference_ID
    }))
  };
}

// ============================================================================
// 14. PENGATURAN TOKO & INTEGRASI AI GROQ (openai/gpt-oss-120b)
// ============================================================================
function getStoreSettings(sessionUser) {
  const settings = getSettingsMap();
  const props = PropertiesService.getScriptProperties();
  const hasGroqKey = Boolean(props.getProperty('GROQ_API_KEY'));
  const groqModel = props.getProperty('GROQ_MODEL_NAME') || settings.ai_model || DEFAULT_GROQ_MODEL;

  return {
    success: true,
    settings: {
      ...settings,
      ai_model: groqModel,
      has_groq_api_key: hasGroqKey
    }
  };
}

function saveStoreSettings(payload, sessionUser) {
  const newSettings = payload.settings || payload;
  const rows = readSheetObjects('Settings');
  const rowByKey = {};
  rows.forEach(r => { rowByKey[String(r.Key || '').trim()] = r; });

  const now = nowStr();
  Object.keys(newSettings).forEach(k => {
    if (k === 'action' || k === 'token' || k === 'groqApiKey') return;
    const val = String(newSettings[k] !== undefined && newSettings[k] !== null ? newSettings[k] : '');
    if (rowByKey[k]) {
      updateObjectRow('Settings', rowByKey[k]._rowIndex, { Value: val, Updated_At: now });
    } else {
      appendObjectRow('Settings', { Key: k, Value: val, Description: 'Pengaturan Operasional', Updated_At: now });
    }
  });

  logActivity(sessionUser.username, sessionUser.role, 'SAVE_SETTINGS', 'Settings', 'Memperbarui konfigurasi toko');
  return { success: true };
}

function saveOwnerSecretSettings(payload, sessionUser) {
  if (sessionUser.role !== 'Owner') {
    return { error: 'Akses Ditolak: Hanya Owner yang dapat mengelola kredensial AI.' };
  }
  const s = payload.secrets || payload;
  const groqKey = String(s.groqApiKey || '').trim();
  const aiModel = String(s.aiModel || s.groqModel || DEFAULT_GROQ_MODEL).trim();

  const props = PropertiesService.getScriptProperties();
  if (groqKey) {
    props.setProperty('GROQ_API_KEY', groqKey);
  }
  props.setProperty('GROQ_MODEL_NAME', aiModel);

  // Simpan juga nama model (bukan API key!) di tab Settings
  saveStoreSettings({ settings: { ai_model: aiModel } }, sessionUser);
  logActivity(sessionUser.username, sessionUser.role, 'SAVE_AI_SECRET', 'ScriptProperties', `Model: ${aiModel}, Key Updated: ${Boolean(groqKey)}`);

  return {
    success: true,
    message: `Konfigurasi AI berhasil disimpan di ScriptProperties (Model: ${aiModel}).`
  };
}

function getGroqConfig() {
  const props = PropertiesService.getScriptProperties();
  const apiKey = String(props.getProperty('GROQ_API_KEY') || '').trim();
  const model = String(props.getProperty('GROQ_MODEL_NAME') || DEFAULT_GROQ_MODEL).trim();
  return { apiKey: apiKey, model: model };
}

/**
 * Fungsi verifikasi langsung koneksi Groq API menggunakan model openai/gpt-oss-120b.
 * Dapat dijalankan langsung dari editor Google Apps Script maupun dari tombol Tes Koneksi Owner.
 */
function testGroqConnection(payload) {
  const cfg = getGroqConfig();
  if (!cfg.apiKey) {
    return {
      success: false,
      error: 'GROQ_API_KEY belum diatur di ScriptProperties. Silakan masukkan API Key melalui menu Pengaturan (Khusus Owner) atau Project Settings > Script Properties.'
    };
  }

  const targetModel = (payload && payload.model) ? String(payload.model).trim() : cfg.model;
  const reqBody = {
    model: targetModel,
    messages: [
      { role: 'system', content: 'Anda adalah asisten analitik bisnis UsahaOS. Jawab singkat dalam Bahasa Indonesia.' },
      { role: 'user', content: 'Konfirmasi koneksi sistem UsahaOS dan sebutkan model yang aktif.' }
    ],
    temperature: 0.2,
    max_completion_tokens: 150
  };

  try {
    const res = UrlFetchApp.fetch(GROQ_API_URL, {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + cfg.apiKey },
      payload: JSON.stringify(reqBody),
      muteHttpExceptions: true
    });

    const status = res.getResponseCode();
    const rawText = res.getContentText();
    let json;
    try { json = JSON.parse(rawText); } catch (e) { json = null; }

    if (status !== 200 || !json || !json.choices || !json.choices[0]) {
      const errMsg = (json && json.error && json.error.message) ? json.error.message : rawText;
      return {
        success: false,
        httpStatus: status,
        modelRequested: targetModel,
        error: `Groq API mengembalikan status ${status}: ${errMsg}`
      };
    }

    return {
      success: true,
      httpStatus: status,
      modelUsed: json.model || targetModel,
      reply: json.choices[0].message.content
    };
  } catch (err) {
    return {
      success: false,
      error: 'Gagal menghubungi endpoint Groq API: ' + err.message
    };
  }
}

// ----------------------------------------------------------------------------
// AI REQUEST BUILDER DENGAN TOKEN BUDGET (mencegah Groq HTTP 413 / TPM 8000)
// Groq menghitung TPM = token input + max_completion_tokens yang diminta.
// Karena tokenizer resmi tidak tersedia di Apps Script, ukuran DIESTIMASI secara
// konservatif (cenderung lebih besar dari aslinya) dan target dibuat di bawah limit.
// ----------------------------------------------------------------------------
const AI_TOKEN_BUDGET = {
  total: 6500,          // target total (input + output) - limit Groq 8000
  output: 1000,         // reservasi max_completion_tokens (model reasoning butuh ruang)
  retryOutput: 600,     // reservasi saat retry setelah 413
  retryTotal: 3200,     // target total saat retry dengan payload diperkecil
  perMessageOverhead: 6,
  maxUserChars: 1200,
  historyMaxMessages: 4,
  historyMsgChars: 500
};

/** Estimasi token konservatif. JSON/angka lebih boros token dibanding teks biasa. */
function estimateTokens(text, isJson) {
  const len = String(text === undefined || text === null ? '' : text).length;
  return Math.ceil(len / (isJson ? 2.2 : 3.0));
}

/** Klasifikasi maksud pertanyaan -> menentukan data mana yang dikirim ke AI. */
function classifyAIIntent(message, history) {
  const hasAny = (txt, words) => words.some(w => txt.indexOf(w) !== -1);
  const rules = {
    stock: ['stok', 'stock', 'persediaan', 'inventori', 'inventory', 'bahan', 'habis', 'menipis', 'restock', 'kulakan', 'material', 'belanja bahan'],
    bom: ['resep', 'bom', 'komposisi', 'takaran'],
    sales: ['omzet', 'penjualan', 'jual', 'pendapatan', 'revenue', 'tren', 'trend', 'laris', 'kategori', 'metode', 'pembayaran', 'hari ini', 'kemarin', 'minggu', 'bulan', 'harian', 'tanggal', 'paling', 'produk'],
    promo: ['promo', 'diskon', 'voucher', 'member', 'loyalitas', 'poin', 'marketing', 'pelanggan', 'kampanye'],
    refund: ['refund', 'retur', 'pengembalian'],
    shift: ['shift', ' kas ', 'selisih', 'laci', 'modal awal'],
    cashier: ['kasir', 'karyawan', 'performa', 'pegawai'],
    margin: ['laba', 'profit', 'hpp', 'margin', 'untung', 'rugi', 'harga pokok', 'keuangan', 'biaya'],
    tx: ['transaksi', 'riwayat', 'struk', 'tx-'],
    movement: ['mutasi'],
    modifier: ['modifier', 'topping', 'add-on', 'addon']
  };
  const classify = txt => {
    const t = ' ' + String(txt || '').toLowerCase() + ' ';
    const found = Object.keys(rules).filter(k => hasAny(t, rules[k]));
    if (/\d{4}-\d{2}-\d{2}/.test(t) && found.indexOf('sales') === -1) found.push('sales');
    return found;
  };

  let intents = classify(message);
  // Pertanyaan lanjutan yang pendek: warisi topik dari pertanyaan user sebelumnya
  const msgLen = String(message || '').length;
  if (history && history.length && (intents.length === 0 || msgLen < 25)) {
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === 'user') {
        classify(history[i].content).forEach(k => { if (intents.indexOf(k) === -1) intents.push(k); });
        break;
      }
    }
  }
  if (intents.length === 0) intents = ['general'];
  return intents;
}

/** Susun rencana irisan data: urutan = prioritas (awal paling penting), level 2=detail, 1=ringkas, 0=minimal. */
function planAISlices(intents) {
  const plan = [{ key: 'core', level: 2, primary: true }];
  const add = (key, level, primary) => {
    const ex = plan.find(p => p.key === key);
    if (ex) {
      if (level > ex.level) ex.level = level;
      if (primary) ex.primary = true;
    } else {
      plan.push({ key: key, level: level, primary: Boolean(primary) });
    }
  };
  const map = {
    sales: () => add('sales', 2, true),
    stock: () => { add('stock', 2, true); add('sales', 0, false); },
    bom: () => { add('bom', 2, true); add('margin', 0, false); },
    promo: () => { add('promo', 2, true); add('sales', 1, false); add('margin', 1, false); },
    refund: () => add('refund', 2, true),
    shift: () => add('shift', 2, true),
    cashier: () => add('cashier', 2, true),
    margin: () => { add('margin', 2, true); add('sales', 1, false); },
    tx: () => add('tx', 2, true),
    movement: () => add('movement', 2, true),
    modifier: () => add('modifier', 2, true),
    general: () => { add('sales', 2, true); add('stock', 1, false); add('promo', 1, false); add('margin', 1, false); add('cashier', 0, false); }
  };
  intents.forEach(i => { if (map[i]) map[i](); });
  return plan;
}

/** Sumber data lazy + cache: hanya sheet yang benar-benar dibutuhkan yang dibaca. */
function createAIDataSources(sessionUser) {
  const cache = {};
  const get = (k, fn) => (Object.prototype.hasOwnProperty.call(cache, k) ? cache[k] : (cache[k] = fn()));
  return {
    dash: () => get('dash', () => getDashboardAnalytics({})),
    activeShift: () => get('activeShift', () => getActiveShiftSession(sessionUser)),
    products: () => get('products', () => getProductsWithEffectiveStock(true)),
    materials: () => get('materials', () => getMaterialsList(true)),
    bom: () => get('bom', () => readSheetObjects('BOM')),
    modGroups: () => get('modGroups', () => getModifierGroupsList(true)),
    modifiers: () => get('modifiers', () => getModifiersList(true)),
    discounts: () => get('discounts', () => getDiscountsList(true)),
    members: () => get('members', () => readSheetObjects('Members')),
    tx: () => get('tx', () => readSheetObjects('Transactions')),
    refunds: () => get('refunds', () => readSheetObjects('Refunds')),
    shifts: () => get('shifts', () => readSheetObjects('Shift_Sessions')),
    movements: () => get('movements', () => readSheetObjects('Stock_Movements'))
  };
}

/** Tabel ringkas {kolom, baris} agar nama field tidak diulang di setiap baris. */
function aiTable(cols, rows) {
  return { kolom: cols, baris: rows };
}

/** Bangun satu irisan data AI. Semua angka berasal dari hasil hitung/data sheet, bukan karangan. */
function buildAISlice(key, level, S, ctx) {
  const N = (big, mid, small) => (level >= 2 ? big : (level === 1 ? mid : small));
  switch (key) {
    case 'core': {
      const s = S.dash().summary;
      return {
        tanggalHariIni: s.todayStr,
        waktuUpdateWIB: nowStr(),
        omzetBersihHariIni: s.todayGross,
        keuanganKeseluruhan: {
          pendapatanKotor: s.grossRevenue,
          totalDiskon: s.totalDiscount,
          totalRefund: s.refundTotal,
          jumlahRefund: s.refundCount,
          pendapatanBersih: s.netRevenue,
          estimasiHPP: s.totalCogs,
          labaKotor: s.grossProfit,
          jumlahTransaksi: s.txCount,
          rataRataTransaksi: s.avgOrderValue
        }
      };
    }
    case 'sales': {
      const d = S.dash();
      const trend = d.dailyTrend || [];
      const out = {
        trenHarian: { totalHariTercatat: trend.length, hariTerakhir: trend.slice(-N(14, 7, 3)) },
        metodePembayaran: d.paymentStats || {}
      };
      const cats = Object.keys(d.categoryStats || {})
        .map(k => ({ kategori: k, omzet: d.categoryStats[k] }))
        .sort((a, b) => b.omzet - a.omzet);
      const nc = N(8, 5, 3);
      out.kategoriTeratas = cats.slice(0, nc);
      if (cats.length > nc) {
        out.kategoriLainnya = {
          jumlah: cats.length - nc,
          totalOmzet: cats.slice(nc).reduce((a, c) => a + (Number(c.omzet) || 0), 0)
        };
      }
      const prodView = p => ({ nama: p.name, kategori: p.category, qty: p.qty, omzet: p.revenue });
      out.produkTerlaris = (d.top5Products || []).slice(0, N(5, 5, 3)).map(prodView);
      if (level >= 1) out.produkTerendah = (d.bottom5Products || []).slice(0, N(5, 3, 0)).map(prodView);
      if (ctx.dates.length) {
        out.detailTanggalDiminta = ctx.dates.map(dt => {
          const row = trend.find(r => r.date === dt);
          return row ? row : { date: dt, tidakAdaPenjualanTercatat: true };
        });
      }
      return out;
    }
    case 'stock': {
      const prods = S.products().filter(p => p.isActive !== false);
      const stat = (stk, min) => (stk <= 0 ? 'HABIS' : (stk <= min ? 'MENIPIS' : 'AMAN'));
      const prodCrit = prods
        .map(p => ({ p: p, st: stat(Number(p.effectiveStock) || 0, Number(p.minStock) || 0) }))
        .filter(x => x.st !== 'AMAN')
        .sort((a, b) => (Number(a.p.effectiveStock) || 0) - (Number(b.p.effectiveStock) || 0));
      const mats = S.materials();
      const matStat = mats.map(m => ({ m: m, st: stat(Number(m.stock) || 0, Number(m.minStock) || 0) }));
      const matCrit = matStat
        .filter(x => x.st !== 'AMAN')
        .sort((a, b) => (Number(a.m.stock) || 0) - (Number(b.m.stock) || 0));
      const nProd = N(25, 12, 6);
      const out = {
        produk: {
          totalAktif: prods.length,
          jumlahHabis: prodCrit.filter(x => x.st === 'HABIS').length,
          jumlahMenipis: prodCrit.filter(x => x.st === 'MENIPIS').length,
          daftarKritis: aiTable(['nama', 'stokEfektif', 'minStok', 'status'],
            prodCrit.slice(0, nProd).map(x => [x.p.name, x.p.effectiveStock, x.p.minStock, x.st])),
          kritisTidakDitampilkan: Math.max(0, prodCrit.length - nProd)
        }
      };
      const nMat = N(40, 12, 6);
      const matList = level >= 2 ? matStat.slice().sort((a, b) => (Number(a.m.stock) || 0) - (Number(b.m.stock) || 0)) : matCrit;
      out.bahanBaku = {
        total: mats.length,
        jumlahHabis: matCrit.filter(x => x.st === 'HABIS').length,
        jumlahMenipis: matCrit.filter(x => x.st === 'MENIPIS').length,
        daftar: aiTable(['nama', 'stok', 'satuan', 'minStok', 'status'],
          matList.slice(0, nMat).map(x => [x.m.name, x.m.stock, x.m.unit, x.m.minStock, x.st])),
        tidakDitampilkan: Math.max(0, matList.length - nMat),
        keterangan: level >= 2 ? 'Daftar berisi bahan baku (diurut stok terendah).' : 'Daftar hanya bahan HABIS/MENIPIS.'
      };
      return out;
    }
    case 'margin': {
      const rows = S.products()
        .filter(p => p.isActive !== false && Number(p.price) > 0)
        .map(p => ({ n: p.name, price: Number(p.price) || 0, cost: Number(p.cost) || 0 }))
        .map(x => Object.assign(x, { pct: Math.round(((x.price - x.cost) / x.price) * 100) }))
        .sort((a, b) => a.pct - b.pct);
      const n = N(20, 10, 5);
      return {
        jumlahProdukAktif: rows.length,
        catatan: 'Diurut dari margin terendah; margin% = (harga-hpp)/harga.',
        produk: aiTable(['nama', 'harga', 'hpp', 'margin%'], rows.slice(0, n).map(x => [x.n, x.price, x.cost, x.pct])),
        tidakDitampilkan: Math.max(0, rows.length - n)
      };
    }
    case 'bom': {
      const prods = S.products();
      const mats = {};
      S.materials().forEach(m => { mats[m.id] = m; });
      const bom = S.bom();
      const rowsByProd = {};
      bom.forEach(b => { (rowsByProd[b.Product_ID] = rowsByProd[b.Product_ID] || []).push(b); });
      const matched = prods.filter(p => p.name && ctx.messageLower.indexOf(String(p.name).toLowerCase()) !== -1);
      if (matched.length) {
        return {
          resep: matched.slice(0, N(4, 2, 1)).map(p => ({
            produk: p.name,
            bahan: aiTable(['bahan', 'qty', 'satuan', 'waste%'],
              (rowsByProd[p.id] || []).map(b => [
                (mats[b.Material_ID] || {}).name || b.Material_ID, Number(b.Qty) || 0, b.Unit, Number(b.Waste_Percent) || 0
              ]))
          })),
          produkCocokTidakDitampilkan: Math.max(0, matched.length - N(4, 2, 1))
        };
      }
      const withBom = prods.filter(p => rowsByProd[p.id]);
      const n = N(30, 15, 8);
      return {
        catatan: 'Sebutkan nama produk spesifik untuk melihat detail resep.',
        totalProdukBerResep: withBom.length,
        jumlahBahanPerProduk: aiTable(['produk', 'jumlahBahan'], withBom.slice(0, n).map(p => [p.name, rowsByProd[p.id].length])),
        tidakDitampilkan: Math.max(0, withBom.length - n)
      };
    }
    case 'promo': {
      const ds = S.discounts().slice().sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0));
      const n = N(10, 6, 3);
      const members = S.members();
      const tiers = {};
      members.forEach(m => { const t = m.Tier || '-'; tiers[t] = (tiers[t] || 0) + 1; });
      const out = {
        totalPromo: ds.length,
        promoAktif: ds.filter(d => d.isActive).length,
        daftarPromo: aiTable(['kode', 'nama', 'tipe', 'nilai', 'minBelanja', 'periode', 'targetKategori', 'aktif'],
          ds.slice(0, n).map(d => [d.code, d.title, d.type, d.value, d.minPurchase,
            (d.startDate || '-') + ' s/d ' + (d.endDate || '-'), d.targetCategory, d.isActive])),
        promoTidakDitampilkan: Math.max(0, ds.length - n),
        member: { total: members.length, perTier: tiers }
      };
      const nm = N(5, 3, 0);
      if (nm > 0) {
        out.member.teratas = aiTable(['nama', 'tier', 'poin', 'totalBelanja'],
          members
            .map(m => [m.Full_Name, m.Tier, Number(m.Points) || 0, Number(m.Total_Spent) || 0])
            .sort((a, b) => b[3] - a[3]).slice(0, nm));
      }
      return out;
    }
    case 'refund': {
      const s = S.dash().summary;
      const rs = S.refunds();
      const n = N(8, 5, 3);
      return {
        totalRefund: s.refundTotal,
        jumlahRefund: s.refundCount,
        terbaru: aiTable(['refundId', 'txId', 'tanggal', 'tipe', 'nominal', 'alasan'],
          rs.slice(-n).reverse().map(r => [r.Refund_ID, r.Tx_ID, normalizeDateWIB(r.Timestamp), r.Refund_Type, Number(r.Refund_Amount) || 0,
            String(r.Reason || '').slice(0, 60)])),
        totalRiwayatRefund: rs.length
      };
    }
    case 'shift': {
      const sh = S.shifts();
      const n = N(5, 3, 1);
      return {
        shiftAktif: S.activeShift().activeShift,
        riwayatTerbaru: aiTable(['kasir', 'buka', 'tutup', 'modalAwal', 'penjualanCash', 'refundCash', 'kasDiharapkan', 'kasAktual', 'selisih', 'status'],
          sh.slice(-n).reverse().map(x => [x.Username, formatTimestampWIB(x.Open_Time), formatTimestampWIB(x.Close_Time),
            Number(x.Opening_Cash) || 0, Number(x.Cash_Sales) || 0, Number(x.Cash_Refunds) || 0,
            Number(x.Expected_Cash) || 0, Number(x.Actual_Cash) || 0, Number(x.Difference) || 0, x.Status])),
        totalRiwayatShift: sh.length
      };
    }
    case 'cashier': {
      const cs = S.dash().cashierStats || [];
      const n = N(8, 5, 3);
      return { totalKasir: cs.length, performa: cs.slice(0, n) };
    }
    case 'tx': {
      const tx = S.tx();
      const n = N(10, 6, 3);
      return {
        totalTransaksiTercatat: tx.length,
        terbaru: aiTable(['txId', 'tanggal', 'kasir', 'metode', 'total', 'statusRefund'],
          tx.slice(-n).reverse().map(t => [t.Tx_ID, normalizeDateWIB(t.Date_WIB || t.Timestamp), t.Cashier, t.Payment_Method,
            Number(t.Total) || 0, t.Refund_Status || 'NONE']))
      };
    }
    case 'movement': {
      const mv = S.movements();
      const n = N(10, 6, 3);
      return {
        totalMutasiTercatat: mv.length,
        terbaru: aiTable(['tanggal', 'item', 'jenis', 'perubahanQty', 'satuan', 'stokAkhir'],
          mv.slice(-n).reverse().map(m => [normalizeDateWIB(m.Timestamp), m.Entity_Name, m.Movement_Type,
            Number(m.Qty_Change) || 0, m.Unit, Number(m.Balance_After) || 0]))
      };
    }
    case 'modifier': {
      const gs = S.modGroups();
      const ms = S.modifiers();
      const n = N(40, 20, 10);
      return {
        grup: aiTable(['grup', 'wajib', 'kategori'], gs.map(g => [g.name, g.required, g.applicableCategories])),
        opsi: aiTable(['grup', 'opsi', 'hargaTambahan'], ms.slice(0, n).map(m => [m.groupName, m.optionName, m.price])),
        opsiTidakDitampilkan: Math.max(0, ms.length - n)
      };
    }
  }
  return null;
}

/**
 * Pilih tingkat detail setiap irisan sehingga konteks muat dalam budget token.
 * Urutan pengecilan: (1) irisan sekunder diperkecil, (2) irisan sekunder dibuang,
 * (3) irisan utama diperkecil, (4) irisan utama dibuang (kecuali data inti).
 */
function fitAIContext(plan, S, ctx, tokenBudget) {
  const memo = {};
  const render = work => {
    const obj = {};
    const parts = {};
    work.forEach(w => {
      const k = w.key + ':' + w.level;
      if (!(k in memo)) memo[k] = buildAISlice(w.key, w.level, S, ctx);
      const slice = memo[k];
      if (slice === null || slice === undefined) return;
      const text = JSON.stringify(slice);
      parts[w.key] = estimateTokens(text, true);
      if (w.key === 'core') obj.dataInti = slice; else obj[w.key] = slice;
    });
    const json = JSON.stringify(obj);
    return { json: json, parts: parts, tokens: estimateTokens(json, true) };
  };

  const work = plan.map(p => ({ key: p.key, level: p.level, primary: p.primary }));
  const dropped = [];
  let built = render(work);
  for (let guard = 0; guard < 80 && built.tokens > tokenBudget; guard++) {
    let acted = false;
    const reduce = prim => {
      for (let i = work.length - 1; i >= 1; i--) {
        if (Boolean(work[i].primary) === prim && work[i].level > 0) { work[i].level--; return true; }
      }
      return false;
    };
    const drop = prim => {
      for (let i = work.length - 1; i >= 1; i--) {
        if (Boolean(work[i].primary) === prim) { dropped.push(work[i].key); work.splice(i, 1); return true; }
      }
      return false;
    };
    acted = reduce(false) || drop(false) || reduce(true) || drop(true);
    if (!acted) break;
    built = render(work);
  }
  built.dropped = dropped;
  built.included = work.map(w => w.key + ':L' + w.level);
  built.fits = built.tokens <= tokenBudget;
  return built;
}

/** Bersihkan riwayat dari frontend: hanya user/assistant, dibatasi jumlah & panjang pesan. */
function sanitizeAIHistory(rawHistory) {
  if (!Array.isArray(rawHistory)) return [];
  return rawHistory
    .filter(h => h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string' && h.content.trim())
    .slice(-30)
    .map(h => ({ role: h.role, content: h.content.trim() }));
}

/** Potong teks di batas kalimat/baris terdekat (bukan di tengah kata/angka). */
function clipAIText(text, maxChars) {
  const t = String(text || '');
  if (t.length <= maxChars) return t;
  const cut = t.slice(0, maxChars);
  const boundary = Math.max(cut.lastIndexOf('\n'), cut.lastIndexOf('. '), cut.lastIndexOf('; '));
  return (boundary > maxChars * 0.5 ? cut.slice(0, boundary + 1) : cut.replace(/\s+\S*$/, '')) + ' ...[dipersingkat]';
}

/** Riwayat panjang -> N pesan terakhir utuh + ringkasan deterministik pertanyaan lama (tanpa LLM tambahan). */
function buildAIHistoryParts(history, maxMessages) {
  const recent = history.slice(-maxMessages).map(h => ({
    role: h.role,
    content: clipAIText(h.content, AI_TOKEN_BUDGET.historyMsgChars)
  }));
  const older = history.slice(0, Math.max(0, history.length - maxMessages));
  let summary = '';
  if (older.length) {
    const qs = older.filter(h => h.role === 'user').slice(-5).map(h => clipAIText(h.content, 80));
    if (qs.length) summary = 'Ringkasan percakapan sebelumnya (pertanyaan user terdahulu): ' + qs.join(' | ');
  }
  return { recent: recent, summary: summary };
}

function extractAIDates(message) {
  const m = String(message || '').match(/\d{4}-\d{2}-\d{2}/g);
  return m ? m.slice(0, 3) : [];
}

const AI_SYSTEM_PROMPT_BASE =
  'Anda adalah AI Business Analyst resmi untuk platform UsahaOS (manajemen operasional bisnis UMKM). ' +
  'Jawablah selalu dalam Bahasa Indonesia yang rapi, profesional, dan akurat. ' +
  'Gunakan HANYA data faktual dari Google Sheets yang disertakan dalam JSON konteks berikut. ' +
  'Jangan pernah mengarang angka di luar data yang diberikan. Format angka uang dalam Rupiah (Rp). ' +
  'Konteks hanya memuat data yang relevan dengan pertanyaan; jika data yang dibutuhkan tidak ada di konteks, ' +
  'katakan terus terang dan sarankan user menanyakan topik tersebut secara spesifik.';

/**
 * Susun seluruh request Groq dalam budget token.
 * options: { reduced: true } -> mode darurat (hanya data inti, tanpa riwayat, output lebih kecil).
 */
function buildAIRequest(userMessageRaw, history, sessionUser, model, options) {
  const reduced = Boolean(options && options.reduced);
  const userMessage = clipAIText(userMessageRaw, AI_TOKEN_BUDGET.maxUserChars);
  const intents = reduced ? ['core-only'] : classifyAIIntent(userMessage, history);
  const plan = reduced ? [{ key: 'core', level: 0, primary: true }] : planAISlices(intents);
  const ctx = { messageLower: userMessage.toLowerCase(), dates: extractAIDates(userMessage) };
  const outputTokens = reduced ? AI_TOKEN_BUDGET.retryOutput : AI_TOKEN_BUDGET.output;
  const totalBudget = reduced
    ? Math.min(AI_TOKEN_BUDGET.retryTotal, (options && options.totalBudget) || AI_TOKEN_BUDGET.retryTotal)
    : AI_TOKEN_BUDGET.total;

  const hist = reduced ? { recent: [], summary: '' } : buildAIHistoryParts(history, AI_TOKEN_BUDGET.historyMaxMessages);
  const ov = AI_TOKEN_BUDGET.perMessageOverhead;
  const fixedTokens = estimateTokens(AI_SYSTEM_PROMPT_BASE, false) + estimateTokens(hist.summary, false) +
    hist.recent.reduce((a, h) => a + estimateTokens(h.content, false) + ov, 0) +
    estimateTokens(userMessage, false) + ov * 3 + 40;
  const contextBudget = Math.max(400, totalBudget - outputTokens - fixedTokens);

  const S = createAIDataSources(sessionUser);
  const fit = fitAIContext(plan, S, ctx, contextBudget);

  let sys = AI_SYSTEM_PROMPT_BASE;
  if (hist.summary) sys += '\n\n' + hist.summary;
  if (fit.dropped.length) sys += '\n\nCatatan: untuk menghemat ukuran, bagian data berikut tidak disertakan: ' + fit.dropped.join(', ') + '.';
  sys += '\n\nDATA AKTUAL DATABASE USAHAOS (REAL-TIME):\n' + fit.json;

  const messages = [{ role: 'system', content: sys }]
    .concat(hist.recent)
    .concat([{ role: 'user', content: userMessage }]);

  const body = { model: model, messages: messages, temperature: 0.25, max_completion_tokens: outputTokens };
  if (/gpt-oss/i.test(model)) body.reasoning_effort = 'low';

  const estInput = estimateTokens(sys, true) + hist.recent.reduce((a, h) => a + estimateTokens(h.content, false) + ov, 0) +
    estimateTokens(userMessage, false) + ov * 2;
  return {
    body: body,
    diagnostics: {
      mode: reduced ? 'reduced' : 'normal',
      intents: intents,
      estInputTokens: estInput,
      estOutputReserve: outputTokens,
      estTotalTokens: estInput + outputTokens,
      contextBudget: contextBudget,
      contextParts: fit.parts,
      contextIncluded: fit.included,
      contextDropped: fit.dropped,
      historyMessagesSent: hist.recent.length,
      historyOlderSummarized: Boolean(hist.summary),
      userMessageTokens: estimateTokens(userMessage, false),
      contextFits: fit.fits
    }
  };
}

/** Satu pemanggilan HTTP ke Groq; tidak pernah melempar karena JSON non-valid. */
function callGroqChat(cfg, body) {
  const res = UrlFetchApp.fetch(GROQ_API_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + cfg.apiKey },
    payload: JSON.stringify(body),
    muteHttpExceptions: true
  });
  const rawText = res.getContentText();
  let json = null;
  try { json = JSON.parse(rawText); } catch (e) { json = null; }
  let retryAfter = '';
  try {
    const h = res.getHeaders() || {};
    retryAfter = String(h['retry-after'] || h['Retry-After'] || '');
  } catch (e) {}
  const errMsg = (json && json.error && json.error.message) ? String(json.error.message) : '';
  return { status: res.getResponseCode(), rawText: rawText, json: json, errMsg: errMsg, retryAfter: retryAfter };
}

function isGroqTooLarge(r) {
  return r.status === 413 || /request too large|reduce your message size/i.test(r.errMsg || '');
}

/** Log diagnostik AMAN: hanya ukuran/estimasi/jenis error. Tidak memuat API key, token sesi, maupun isi data/pertanyaan. */
function logAIDiagnostics(label, diag, extra) {
  try {
    console.log('[AI] ' + label + ' ' + JSON.stringify(Object.assign({}, diag, extra || {})));
  } catch (e) {}
}

function askGroqBusinessAnalyst(payload, sessionUser) {
  const userMessage = String(payload.message || '').trim();
  if (!userMessage) return { error: 'Pertanyaan tidak boleh kosong.' };

  const cfg = getGroqConfig();
  if (!cfg.apiKey) {
    return {
      error: 'GROQ_API_KEY belum dikonfigurasi di ScriptProperties. Login sebagai Owner dan buka menu Pengaturan -> Kredensial Rahasia AI untuk menyimpan Groq API Key Anda.'
    };
  }

  const history = sanitizeAIHistory(payload.history);
  const friendlyTooLarge = 'Pertanyaan ini membutuhkan data yang terlalu besar untuk diproses AI sekaligus. ' +
    'Coba persempit pertanyaan (mis. sebut topik, produk, atau tanggal tertentu) lalu kirim lagi.';

  try {
    // Percobaan 1: payload dipilih berdasarkan maksud pertanyaan & dibatasi token budget
    const req = buildAIRequest(userMessage, history, sessionUser, cfg.model, { reduced: false });
    const r1 = callGroqChat(cfg, req.body);
    let r = r1;
    let usedReq = req;
    let retried = false;

    // Hanya JIKA ditolak karena terlalu besar: SATU kali retry dengan payload JAUH lebih kecil (bukan retry payload sama)
    if (isGroqTooLarge(r1)) {
      const lim = /Limit\s+(\d+)/i.exec(r1.errMsg || '');
      const requested = /Requested\s+(\d+)/i.exec(r1.errMsg || '');
      logAIDiagnostics('GROQ_TOO_LARGE', req.diagnostics, {
        httpStatus: r1.status,
        groqLimit: lim ? Number(lim[1]) : null,
        groqRequested: requested ? Number(requested[1]) : null,
        willRetryReduced: true
      });
      const reducedBudget = lim ? Math.floor(Number(lim[1]) * 0.4) : AI_TOKEN_BUDGET.retryTotal;
      const req2 = buildAIRequest(userMessage, history, sessionUser, cfg.model, { reduced: true, totalBudget: reducedBudget });
      retried = true;
      usedReq = req2;
      r = callGroqChat(cfg, req2.body);
      if (isGroqTooLarge(r)) {
        logAIDiagnostics('GROQ_TOO_LARGE_AFTER_REDUCE', req2.diagnostics, { httpStatus: r.status, gaveUp: true });
        return { error: friendlyTooLarge };
      }
    }

    if (r.status === 429) {
      logAIDiagnostics('GROQ_RATE_LIMITED', usedReq.diagnostics, { httpStatus: 429, retryAfter: r.retryAfter });
      return {
        error: 'Batas penggunaan AI per menit sedang tercapai. Tunggu' +
          (r.retryAfter ? ' sekitar ' + r.retryAfter + ' detik' : ' beberapa saat') + ' lalu kirim ulang pertanyaan Anda.'
      };
    }

    const json = r.json;
    if (r.status !== 200 || !json || !json.choices || !json.choices[0]) {
      logAIDiagnostics('GROQ_ERROR', usedReq.diagnostics, { httpStatus: r.status });
      const errDetail = r.errMsg || String(r.rawText || '').slice(0, 300);
      return { error: `Gagal memproses analisis AI (${cfg.model} - HTTP ${r.status}): ${errDetail}` };
    }

    const choice = json.choices[0];
    const content = choice.message && choice.message.content ? String(choice.message.content) : '';
    if (!content.trim()) {
      logAIDiagnostics('GROQ_EMPTY_REPLY', usedReq.diagnostics, { finishReason: choice.finish_reason || '' });
      return { error: 'AI tidak menghasilkan jawaban (kemungkinan batas keluaran tercapai). Coba persempit pertanyaan Anda.' };
    }

    logAIDiagnostics('OK', usedReq.diagnostics, { retried: retried, finishReason: choice.finish_reason || '',
      usage: json.usage ? { prompt: json.usage.prompt_tokens, completion: json.usage.completion_tokens, total: json.usage.total_tokens } : null });

    return {
      success: true,
      modelUsed: json.model || cfg.model,
      reply: content,
      meta: { estInputTokens: usedReq.diagnostics.estInputTokens, intents: usedReq.diagnostics.intents, retriedWithReducedPayload: retried }
    };
  } catch (err) {
    console.log('[AI] EXCEPTION ' + (err && err.name ? err.name : 'Error'));
    return { error: 'Gagal menghubungi layanan Groq API: ' + err.message };
  }
}

function triggerManualBackup(sessionUser) {
  const ss = getDB();
  const backupName = 'Backup_Snapshot_' + Utilities.formatDate(new Date(), TZ, 'yyyyMMdd_HHmm');
  let sheet = ss.getSheetByName(backupName);
  if (!sheet) {
    sheet = ss.insertSheet(backupName);
  }
  const summaryRows = [
    ['Snapshot Backup Database UsahaOS', nowStr(), 'Oleh: ' + sessionUser.username],
    ['Tab Name', 'Jumlah Baris Data']
  ];
  Object.keys(SCHEMA).forEach(tab => {
    const s = ss.getSheetByName(tab);
    summaryRows.push([tab, s ? Math.max(0, s.getLastRow() - 1) : 0]);
  });
  sheet.getRange(1, 1, summaryRows.length, 3).setValues(summaryRows.map(r => [r[0] || '', r[1] !== undefined ? r[1] : '', r[2] || '']));
  logActivity(sessionUser.username, sessionUser.role, 'MANUAL_BACKUP', backupName, 'Membuat snapshot ringkasan backup');
  return { success: true, message: `Snapshot ringkasan database berhasil disimpan pada tab "${backupName}".` };
}
