package com.org.gen.json2pojo.fileaccess;

import java.util.Iterator;
import java.util.Map;

/**
 * This interface provides a uniform set of api's for accessing data in tabular manner irrespective of underlying
 * datasource e.g database, excel etc. Row/Columns start index is at 1 and not 0;
 * 
 * @author Kash
 * @version 1.0
 */
public interface TableBasedDataAccess extends Iterable<Object[]> {

    /**
     * Represents an empty cell.
     */
    public static final Object EMPTY_CELL = new Object() {
    	public String toString() {
    		return "EMPTY CELL";
    	};
    };

    /**
     * Returns a list of objects found as the data source.
     * 
     * @return iterator to iterator over the data items in the source.
     */
    public Iterator<Object[]> iterator();

    /**
     * Get data at specific row. Null values are not permitted instead EMPTY_CELL needs to be used.
     * 
     * @param rowNum
     *            row number
     * @return list of object found at the row.
     */
    public Object[] getAt(int rowNum);

    /**
     * Search the existing data source and return table view containing all rows matching specific column with a
     * specific value. Empty table view and not null will be returned if no rows found.
     * 
     * @param column
     *            column index.
     * @param key
     *            seach key.
     * @return table view.
     */
    public TableBasedDataAccess searchColumnMatching(int column, String key);

    /**
     * Search the existing data source and return table view containing all rows matching set of columns and
     * corresponding values.
     * 
     * @param criteria
     *            key value pair of column index and expected value.
     * @return table view.
     */
    public TableBasedDataAccess searchColumnsMatching(Map<Integer, String> criteria);
    
    /**
     * Returns the size of table.
     * @return
     */
    public int getTableSize();
}
