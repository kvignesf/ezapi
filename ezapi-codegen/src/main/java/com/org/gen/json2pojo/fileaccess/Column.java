/**
 * 
 */
package com.org.gen.json2pojo.fileaccess;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/**
 * Represents a colum found in the data sheet. Each column has a name and meta data.
 * 
 * @author blakshminarayana
 *
 */
public class Column {

    private static final String EMPTY = "";

    private final String columnName;
    private final Set<ColumnType> columnTypes;
    private final Header parent;
    private final List<Integer> indices = new ArrayList<>();
    private String nameSpace = EMPTY;
    
    private String referenceSheet;

    /**
     * Represent the a specific column type.
     * 
     * @author MSivapr
     * @version 1.0
     */
    public static enum ColumnType {
        ExternalColumn("::"), ControlColumn("_Cntrl_"), NonControlColumn("");

        private final String indicator;

        /**
         * Initialize with the relevant string identifier for the column name
         * 
         * @param indicator
         */
        private ColumnType(String indicator) {
            this.indicator = indicator;
        }

        /**
         * Returns the type of column from the column name.
         * 
         * @param columnName
         *            name of the column
         * @return
         */
        public static Set<ColumnType> getTypeFromName(String columnName) {
            EnumSet<ColumnType> columnTypes = EnumSet.noneOf(ColumnType.class);
            for (ColumnType type : values()) {
                if (type != NonControlColumn && columnName.contains(type.indicator)) {
                    columnTypes.add(type);
                }
            }
            if (!columnTypes.contains(ControlColumn)) {
                columnTypes.add(NonControlColumn);
            }
            return columnTypes;
        }

    }

    /**
     * Initialize with external column name
     * 
     * @param acutalColumnName
     */
    public Column(Header parent, String acutalColumnName, List<Integer> indices) {
        this.columnTypes = ColumnType.getTypeFromName(acutalColumnName);
        String currentColName = acutalColumnName;
        this.indices.addAll(indices);

        if (this.columnTypes.contains(ColumnType.ExternalColumn)) {
            int extColIdx = currentColName.indexOf(ColumnType.ExternalColumn.indicator);
            currentColName = currentColName.substring(0, extColIdx);
            this.referenceSheet = acutalColumnName.substring(extColIdx + 2);
        }

        if (this.columnTypes.contains(ColumnType.ControlColumn)) {
            currentColName = currentColName.replace(ColumnType.ControlColumn.indicator, EMPTY);
        }
        /*
         * if (this.columnTypes.contains(ColumnType.NamespaceColumn)) { int idx = currentColName.indexOf(ColumnType.NamespaceColumn.indicator); this.nameSpace =
         * currentColName.substring(0, idx); currentColName = currentColName.replace(ColumnType.NamespaceColumn.indicator,EMPTY); }
         */
        this.columnName = currentColName;
        this.parent = parent;
    }

    /**
     * @return the columnName
     */
    public String getColumnName() {
        return columnName;
    }

    /**
     * @return the columnTypes
     */
    public Set<ColumnType> getColumnTypes() {
        return columnTypes;
    }
    
    /**
     * Returns if the given column is of type.
     * @param type
     * @return
     */
    public boolean isOfType(ColumnType type) {
        return columnTypes.contains(type);
    }

    /**
     * Gets the namespace for the column
     * 
     * @return
     */
    public String getNameSpace() {
        return nameSpace;
    }

    /**
     * @return the index
     */
    public List<Integer> getIndex() {
        return indices;
    }
    
    /**
     * @return the referenceSheet
     */
    public String getReferenceSheet() {
        return referenceSheet;
    }

    /**
     * Reffered parent
     * 
     * @return
     */
    public Header getParent() {
        return parent;
    }

    /* (non-Javadoc)
     * @see java.lang.Object#toString()
     */
    @Override
    public String toString() {
        return "Column [columnName=" + columnName + ", columnTypes=" + columnTypes + ", parent=" + parent + ", indices=" + indices + ", nameSpace=" + nameSpace
                + ", referenceSheet=" + referenceSheet + "]";
    }
    
}