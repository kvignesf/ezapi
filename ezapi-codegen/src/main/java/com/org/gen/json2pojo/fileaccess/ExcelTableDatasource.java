package com.org.gen.json2pojo.fileaccess;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFSheet;

/**
 * Provides a table based data access based on excel sheets. This is a in-memory model where the data is read and maintained in memory. Supported data types for
 * cell values are string and numeric.
 * 
 * @author Kash
 * @version 1.0
 */
public class ExcelTableDatasource implements TableBasedDataAccess {

    private final List<Object[]>              excelRows;
    private final Map<String, List<Object[]>> indexBasedTable = new HashMap<String, List<Object[]>>();

    /**
     * Initialize empty table.
     */
    public ExcelTableDatasource() {
        this.excelRows = new ArrayList<Object[]>();
    }

    /**
     * Initialize with excel rows.
     * 
     * @param excelRows
     */
    public ExcelTableDatasource(List<Object[]> excelRows) {
        this.excelRows = excelRows;
    }

    /**
     * 
     * @param excelRows
     * @param index
     */
    public ExcelTableDatasource(List<Object[]> excelRows, int index) {
        this.excelRows = excelRows;
        initializeTableIndices(index);
    }

    private void initializeTableIndices(int index) {
        for (Object[] arr : this.excelRows) {
            Object indexCol = arr[index];
            String key = index + "-" + indexCol.toString();
            List<Object[]> idxTableValue = null;
            if (!indexBasedTable.containsKey(key)) {
                idxTableValue = new ArrayList<Object[]>();
                indexBasedTable.put(key, idxTableValue);
            }
            idxTableValue.add(arr);
        }
    }

    /**
     * Initialize with excel sheet, the rows are read and maintained in memory
     * 
     * @param sheet
     */
	public ExcelTableDatasource(Sheet sheet) {
        excelRows = new ArrayList<Object[]>();
        for (Row rowTemp : sheet) {
            Row row = (Row) rowTemp;
            int iteration = 0;
            boolean isAllCellsEmpty = true;
            Object[] cells = new Object[row.getLastCellNum()];
            for (int count = 0; count < row.getLastCellNum(); count++) {
                Cell cell = row.getCell(count);
                // if not available then make it empty
                if (cell == null) {
                    cells[iteration] = TableBasedDataAccess.EMPTY_CELL;
                    iteration++;
                    continue;
                }
                switch (cell.getCellType()) {
                case BLANK:
                    cells[iteration] = TableBasedDataAccess.EMPTY_CELL;
                    break;
                case BOOLEAN:
                    cells[iteration] = cell.getBooleanCellValue();
                    isAllCellsEmpty = false;
                    break;
                case NUMERIC:
                    cells[iteration] = cell.getNumericCellValue();
                    isAllCellsEmpty = false;
                    break;
                case STRING:
                    cells[iteration] = cell.getStringCellValue();
                    isAllCellsEmpty = false;
                    break;
                default:
                    cells[iteration] = TableBasedDataAccess.EMPTY_CELL;
                    break;
                }
                iteration++;
            }
            // donot add empty rows
            if (!isAllCellsEmpty) {
                excelRows.add(cells);
            }
        }
    }

    public ExcelTableDatasource(XSSFSheet sheet, int index) {
        this(sheet);
        initializeTableIndices(index);
    }

    /*
     * (non-Javadoc)
     * 
     * @see data_access.TableBasedDataAccess#iterator()
     */
    public Iterator<Object[]> iterator() {
        return excelRows.iterator();
    }

    /*
     * (non-Javadoc)
     * 
     * @see data_access.TableBasedDataAccess#getAt(int)
     */
    public Object[] getAt(int rowNum) {
        return excelRows.get(rowNum);
    }

    /*
     * (non-Javadoc)
     * 
     * @see data_access.TableBasedDataAccess#searchColumnMatching(int, java.lang.String)
     */
    public TableBasedDataAccess searchColumnMatching(int column, String key) {
        ExcelTableDatasource datasource = new ExcelTableDatasource();
        searchForMatchingKey(column, key, datasource.excelRows);
        return datasource;
    }

    private void searchForMatchingKey(int column, String key, List<Object[]> tableData) {
        List<Object[]> cached = indexBasedTable.get(column + "-" + key);
        if (cached == null) {
            // costly search
            searchForMatchingKeyInAllRows(column, key, tableData);
        } else {
            tableData.addAll(cached);
        }
    }

    private void searchForMatchingKeyInAllRows(int column, String key, List<Object[]> tableData) {
        for (Object[] arr : this.excelRows) {
            if (key.equals(arr[column].toString())) {
                tableData.add(arr);
            }
        }
    }

    /*
     * (non-Javadoc)
     * 
     * @see data_access.TableBasedDataAccess#searchColumnsMatching(java.util.Map)
     */
    public TableBasedDataAccess searchColumnsMatching(Map<Integer, String> criteria) {
        ExcelTableDatasource datasource = new ExcelTableDatasource();
        for (Entry<Integer, String> entry : criteria.entrySet()) {
            searchForMatchingKey(entry.getKey(), entry.getValue(), datasource.excelRows);
        }
        return datasource;
    }

    /**
     * Retuns the current table size
     */
    public int getTableSize() {
        return excelRows.size();
    }
}