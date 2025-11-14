package com.org.gen.json2pojo.fileaccess;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


/**
 * Datasheet contains test data and has associated context e.g. name of the file the sheet was located in, path of the excel file, sheet name. These context
 * information can be used to filter sheets based on relevant criteria. Each datasheet in excel should have a header so as enable lookup of cell values by
 * column names along with row index. The first row in excel is considered as header.
 * 
 * @author Kash
 * @version 1.0
 */
public class DataSheet implements Iterable<TestDataRow> {

    private static final Logger        logger = LoggerFactory.getLogger(DataSheet.class);
    private final Header               dataColumnHeader;
    private final int                  columnsSize;

    private final Map<String, String>  dataSheetContext;
    private final TableBasedDataAccess dataAccess;
    private final String               name;
    private final NativeTypeConvertor  convertor;
    private final DataSheetContainer   container;

    /**
     * Initialize the data sheet with context and table data access to access the data from data source.
     * 
     * @param dataSheetContext
     * @param dataAccess
     */
    public DataSheet(String name, Map<String, String> dataSheetContext, TableBasedDataAccess dataAccess, NativeTypeConvertor convertor,
            DataSheetContainer container) {
        this.name = name;
        this.container = container;
        this.dataSheetContext = dataSheetContext;
        this.dataAccess = dataAccess;
        Object[] headerColumnNames = this.dataAccess.getAt(0);
        this.columnsSize = headerColumnNames.length;
        this.dataColumnHeader = new Header(headerColumnNames, this);
        this.convertor = convertor;
    }

    /**
     * Returns the test data row at the specified row number.
     * 
     * @param rowNum
     *            row number
     * @return
     */
    public TestDataRow getAt(int rowNum) {
        return createDataRow(rowNum);
    }

    private TestDataRow createDataRow(int rowNum) {
        Object[] dataValues = dataAccess.getAt(rowNum + 1);
        return new TestDataRow(dataValues, dataColumnHeader, convertor, this);
    }

    /**
     * Search the existing data sheet and return view containing all rows matching specific column with a specific value.
     * 
     * @param column
     *            column index.
     * @param key
     *            seach key.
     * @return table view.
     */
    public List<TestDataRow> searchColumnMatching(int column, String key) {
        final List<TestDataRow> rows = new ArrayList<TestDataRow>();
        this.forEach((row) -> {
            if (row.valueAt(this.header().columnAtIdx(column)).stream().anyMatch((cell) -> {
                return key.equals(cell.getValue());
            })) {
                rows.add(row);
            }
        });
        return rows;
    }

    /**
     * Search the existing data sheet and return view containing all rows matching specific column with a specific value.
     * 
     * @param column
     *            column index.
     * @param key
     *            seach key.
     * @return table view.
     */
    public List<TestDataRow> searchColumnsMatchingContent(Map<String, List<?>> criteria) {
        final List<TestDataRow> rows = new ArrayList<TestDataRow>();
        this.forEach((row) -> {
            boolean canAdd = criteria.keySet().stream().allMatch((key) -> {
                Set<Object> dataCells = valuesInColumn(row, key);
                return criteria.get(key).stream().allMatch((searchCell) -> {
                    Object val = searchCell;
                    if (searchCell instanceof Cell) {
                        val = ((Cell) searchCell).getValue();
                    }
                    return dataCells.contains(val);
                });
            });
            if (canAdd) {
                rows.add(row);
            }
        });
        return rows;
    }

    private Set<Object> valuesInColumn(TestDataRow row, String name) {
        Column column = this.header().findColumn(name);
        if (column == null) {
            throw new IllegalArgumentException("Column name '" + name + "' not found in " + row);
        }
        return row.valueAt(column).stream().map(Cell::getValue).collect(Collectors.toSet());
    }

    /**
     * @return the header
     */
    public Header header() {
        return dataColumnHeader;
    }

    /**
     * @return the parent container
     */
    public DataSheetContainer container() {
        return this.container;
    }

    /**
     * @return the dataSheetContext
     */
    public Map<String, String> getDataSheetContext() {
        return dataSheetContext;
    }

    /**
     * Returns the iterator for getting the list of test data items.
     * 
     * @return iterator.
     */
    public Iterator<TestDataRow> iterator() {
        return new Iterator<TestDataRow>() {

            private int currRow = 0;

            /**
             * Return if more elements are available as part table.
             */
            public boolean hasNext() {
                // as the first element is always the header element which
                // should not be returned.
                return currRow < DataSheet.this.dataAccess.getTableSize() - 1;
            }

            /**
             * Next in the row
             */
            public TestDataRow next() {
                TestDataRow row = DataSheet.this.getAt(currRow);
                currRow++;
                return row;
            }

            public void remove() {
                throw new UnsupportedOperationException("Remove operation called on a read-only datasheets");
            }
        };
    }

    /**
     * @return the name
     */
    public String getName() {
        return name;
    }

    /**
     * @return the convertor
     */
    public NativeTypeConvertor getConvertor() {
        return convertor;
    }

    /**
     * Returns the column size for the data sheet. Includes control column, reference and regular columns.
     * 
     * @return
     */
    public int getColumnsSize() {
        return columnsSize;
    }

    /*
     * (non-Javadoc)
     * 
     * @see java.lang.Object#toString()
     */
    @Override
    public String toString() {
        return "DataSheet [dataColumnHeader=" + dataColumnHeader + ", name=" + name + "]";
    }
}