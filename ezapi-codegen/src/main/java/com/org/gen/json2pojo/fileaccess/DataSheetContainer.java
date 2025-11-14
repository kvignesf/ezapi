package com.org.gen.json2pojo.fileaccess;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.function.BiPredicate;

/**
 * Container for one or more test data sheets. Provides APIs to select relevant datasheet based on properties.
 * 
 * @author Kash
 * @version 1.0
 */
public class DataSheetContainer {

    private final List<DataSheet> dataSheets = new ArrayList<DataSheet>();

    private final Map<String, String> testConfiguration;

    /**
     * @param testConfiguration
     */
    public DataSheetContainer(Map<String, String> testConfiguration) {
        this.testConfiguration = testConfiguration;
    }

    /**
     * @return the testConfiguration
     */
    public Map<String, String> getTestConfiguration() {
        return testConfiguration;
    }

    /**
     * Finds the list of sheets that match by name.
     * 
     * @param name
     * @return
     */
    public List<DataSheet> findSheetByName(String name) {
        return findSheetUsingFilter(name, (inputName, sheetname) -> {
            return inputName.equals(sheetname);
        });
    }

    private List<DataSheet> findSheetUsingFilter(String name, BiPredicate<String, String> filter) {
        List<DataSheet> matchingSheets = new ArrayList<DataSheet>();
        for (DataSheet sheet : dataSheets) {
            if (filter.test(name, sheet.getName())) {
                matchingSheets.add(sheet);
            }
        }
        return matchingSheets;
    }

    /**
     * Finds the list of sheets that match by name.
     * 
     * @param name
     * @return
     */
    public List<DataSheet> findSheetByNamePrefix(String name) {
        return findSheetUsingFilter(name, (inputName, sheetname) -> {
            return sheetname.startsWith(inputName);
        });
    }

    /**
     * Find the list of datasheets matching the specified set criteria. The list is sorted by sheets having the maximum matches.
     * 
     * @param criteria
     *            selection criteria.
     * @return list of data sheets.
     */
    public List<DataSheet> findSheetByCriteria(Map<String, String> criteria) {
        List<Object[]> foundSheets = new ArrayList<Object[]>();
        for (DataSheet sheet : dataSheets) {
            int matchCount = 0;
            Map<String, String> currContext = sheet.getDataSheetContext();
            for (Entry<String, String> matchingCriteria : criteria.entrySet()) {
                if (currContext.containsKey(matchingCriteria.getKey()) && matchingCriteria.getValue().equals(currContext.get(matchingCriteria.getKey()))) {
                    matchCount++;
                }
            }
            if (matchCount > 0) {
                foundSheets.add(new Object[] { sheet, matchCount });
            }
        }
        // do sort only if there are more things to match so as provide the segregate ones with most matches.
        if (criteria.size() > 1) {
            // sort by assending
            Collections.sort(foundSheets, new Comparator<Object[]>() {
                public int compare(Object[] o1, Object[] o2) {
                    return ((Integer) o1[1]).compareTo((Integer) o2[1]);
                }
            });
        }
        // make it descending, hence most matching sheets are at the top
        List<DataSheet> dataSheets = new ArrayList<DataSheet>();
        for (Object arr[] : foundSheets) {
            dataSheets.add(0, (DataSheet) arr[0]);
        }
        return dataSheets;
    }

    /**
     * @return the dataSheets
     */
    public List<DataSheet> getDataSheets() {
        return dataSheets;
    }
    
    /**
     * Adds the data sheet to container.
     * @param dataSheet data sheet to be added.
     */
    public void addDataSheet(DataSheet dataSheet) {
        dataSheets.add(dataSheet);
        
    }
}
