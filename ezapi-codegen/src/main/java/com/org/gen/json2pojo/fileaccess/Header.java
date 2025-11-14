package com.org.gen.json2pojo.fileaccess;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import com.org.gen.json2pojo.fileaccess.Column.ColumnType;


/**
 * Represents a header element as part of the test data which provide column names for the test data provided. The header can be used to query the column names.
 * 
 * @author Kash
 * @version 1.0
 */
public class Header {

    private final List<Column> orginalCols = new ArrayList<>();
    private final Map<ColumnType, List<Column>> typeToColMapping = new LinkedHashMap<>();
    private final Map<String, Column> nameToColMapping = new LinkedHashMap<>();
    private final DataSheet parent;

    /**
     * Initializes the headers to a list of column names
     * 
     * @param columnNames
     */
    public Header(Object[] columnNames, DataSheet dataSheet) {
        this.parent = dataSheet;
        AtomicInteger index = new AtomicInteger(0);
        Map<String, List<Integer>> colNameToIdxMap = new LinkedHashMap<>();
        Arrays.asList(columnNames).forEach((columnName) -> {
            colNameToIdxMap.putIfAbsent(columnName.toString(), new LinkedList<>());
            colNameToIdxMap.get(columnName.toString()).add(index.getAndIncrement());
        });
        colNameToIdxMap.forEach((key, value) -> {
            Column col = new Column(this, key, value);
            orginalCols.add(col);
            nameToColMapping.put(col.getColumnName(), col);
            for (ColumnType colType : col.getColumnTypes()) {
                typeToColMapping.putIfAbsent(colType, new LinkedList<>());
                typeToColMapping.get(colType).add(col);
            }
        });
    }

    /**
     * Returns the column name with the specified type
     * 
     * @param columnName
     * @param colType
     * @return
     */
    public Column findColumn(String columnName) {
        return nameToColMapping.get(columnName);
    }

    /**
     * Find the column name matching the provide pattern
     * 
     * @param columnName
     * @return
     */
    public List<Column> findColumnMatching(Pattern pattern) {
        return nameToColMapping.keySet().stream().filter(pattern.asPredicate()).map(key -> nameToColMapping.get(key)).collect(Collectors.toList());
    }

    /**
     * Returns all columns of a specific set of types within current header
     * 
     * @param columnName
     * @param colType
     * @return
     */
    public List<Column> findColumnsOfType(ColumnType... colType) {
        List<Column> map = new LinkedList<>();
        for (ColumnType type : colType) {
            List<Column> dataforType = typeToColMapping.getOrDefault(type, new LinkedList<>());
            dataforType.forEach((value) -> {
                map.add(value);
            });
        }
        return map;
    }

    /**
     * Returns all columns of a specific set of types across current header and any external header columns
     * 
     * @param columnName
     * @param colType
     * @return
     */
    public List<Column> findAllColumnsOfType(ColumnType... colType) {
        List<Column> cols = new ArrayList<>();
        Set<ColumnType> providedTypes = Arrays.asList(colType).stream().collect(Collectors.toSet());
        orginalCols.forEach((col) -> {
            if (!col.getColumnTypes().contains(ColumnType.ExternalColumn)) {
                Set<ColumnType> set = EnumSet.copyOf(col.getColumnTypes());
                set.retainAll(providedTypes);
                if (!set.isEmpty()) {
                    cols.add(col);
                }
            } else {
                cols.addAll(parent.container().findSheetByName(col.getReferenceSheet()).get(0).header().findAllColumnsOfType(colType));
            }
        });
        return cols;
    }

    /**
     * Returns column at index, no support for external links
     * 
     * @param index
     * @return
     */
    public Column columnAtIdx(int index) {
        return orginalCols.get(index);
    }

    /**
     * @return the parent
     */
    public DataSheet getParent() {
        return parent;
    }

}