package com.org.gen.json2pojo.fileaccess;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import com.org.gen.json2pojo.fileaccess.Column.ColumnType;


/**
 * Represents a row of test data. Each row is a collection of cells ordered in a specific manner depending upon the test data source e.g.
 * incase of excel sheets the cell order is the column order in the excel sheet. Empty cells are allowed as long as tagged with EMPTY_CELL
 * marker object. Null values are not allowed.
 * 
 * @author Kash
 * @version 1.0
 */
public class TestDataRow {

    /**
     * Represents a scenario where the requested cell is not found.
     */
    public static final Object NO_DATA = new Object() {
        public String toString() {
            return "NO DATA";
        };
    };

    private final DataSheet parentSheet;
    private final Map<Integer, Object> cellValues;
    private final int rowSize;
    private final NativeTypeConvertor convertor;

    /**
     * Initialize the row values.
     * 
     * @param rowValues
     */
    public TestDataRow(Object[] rowValues, Header header, NativeTypeConvertor convertor, DataSheet parentSheet) {
        rowSize = rowValues.length;
        this.parentSheet = parentSheet;
        this.convertor = convertor;
        cellValues = new HashMap<Integer, Object>();
        int count = 0;
        for (Object value : rowValues) {
            if (!TableBasedDataAccess.EMPTY_CELL.equals(value)) {
                cellValues.put(count, value);
            }
            count++;
        }
    }

    /**
     * Returns the cell value at index.
     * 
     * @param index
     * @return
     */
    public Cell firstValueAt(Column column) {
        return valueAt(column).get(0);
    }

    /**
     * Get the the value at a specific index.
     * 
     * @param column
     * @return
     */
    public List<Cell> valueAt(Column column) {
        return column.getIndex().stream().map(idx -> new Cell(column, cellValues.get(idx), idx))
                .collect(Collectors.toList());
    }

    /**
     * Returns all the values in the column as data items.
     * 
     * @param column
     * @return
     */
    public Set<Object> valuesInColumn(Column column) {
        return valueAt(column).stream().map(Cell::getValue).collect(Collectors.toSet());
    }

    /**
     * Returns the value for the given column name.
     * 
     * @param columnName
     * @return
     */
    public List<Cell> valueAt(ColumnType type) {
        final List<Cell> val = new LinkedList<>();
        parentSheet.header().findColumnsOfType(type).forEach((value) -> {
            if (!value.getColumnTypes().contains(ColumnType.ExternalColumn)) {
                val.addAll(valueAt(value));
            }
        });
        searchAllExternalSheets(null, type, val);
        return val;
    }

    /**
     * Gets all the row data as map, support lookup of external columns
     * 
     * @return
     */
    public Map<String, List<Cell>> asMap() {
        Map<String, List<Cell>> dataMap = new LinkedHashMap<>();
        parentSheet.header().findAllColumnsOfType(ColumnType.ControlColumn, ColumnType.NonControlColumn).forEach((column) -> {
            dataMap.put(column.getColumnName(), this.valueAt(column.getColumnName()));
        });
        return dataMap;
    }

    /**
     * Returns the value for the given column name.
     * 
     * @param columnName
     * @return
     */
    public List<Cell> valueAt(String columnName) {
        final List<Cell> val = new LinkedList<>();
        Column col = parentSheet.header().findColumn(columnName);
        if (col != null && !col.getColumnTypes().contains(ColumnType.ExternalColumn)) {
            val.addAll(valueAt(col));
        }
        searchAllExternalSheets(columnName, null, val);
        return val;

    }

    private void searchAllExternalSheets(String columnName, ColumnType type, final List<Cell> val) {
        Map<String, Map<String, List<?>>> searchCriteria = new HashMap<>();
        parentSheet.header().findColumnsOfType(ColumnType.ExternalColumn).forEach((value) -> {
            searchCriteria.putIfAbsent(value.getReferenceSheet(), new HashMap<>());
            searchCriteria.get(value.getReferenceSheet()).put(value.getColumnName(), valueAt(value));
        });
        searchCriteria.forEach((key, value) -> {
            dataSheet().container().findSheetByName(key).get(0).searchColumnsMatchingContent(value).forEach((row) -> {
                List<Cell> innerVal = null;
                if (type != null) {
                    innerVal = row.valueAt(type);
                } else {
                    innerVal = row.valueAt(columnName);
                }
                if (!innerVal.isEmpty()) {
                    val.addAll(innerVal);
                }
            });

        });
    }

    /**
     * @return the rowSize
     */
    public int getRowSize() {
        return rowSize;
    }

    /**
     * @return the convertor
     */
    public NativeTypeConvertor getConvertor() {
        return convertor;
    }

    /**
     * Return the parent sheet associated with test data row
     * 
     * @return
     */
    public DataSheet dataSheet() {
        return parentSheet;
    }

    /*
     * (non-Javadoc)
     * 
     * @see java.lang.Object#toString()
     */
    @Override
    public String toString() {
        return "TestDataRow [parentSheet=" + parentSheet + ", cellValues=" + cellValues + "]";
    }
}