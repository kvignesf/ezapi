/**
 * 
 */
package com.org.gen.json2pojo.fileaccess;

/**
 * @author blakshminarayana
 *
 */
public class Cell {

    private final Column column;
    private final Object value;
    private final int index;
    
    /**
     * @param column
     * @param value
     */
    public Cell(Column column, Object value,int index) {
        this.column = column;
        this.value = value;
        this.index = index;
    }

    /**
     * @return the column
     */
    public Column getColumn() {
        return column;
    }

    /**
     * @return the value
     */
    public Object getValue() {
        return value;
    }

    /**
     * @return the index
     */
    public int getIndex() {
        return index;
    }  
}
