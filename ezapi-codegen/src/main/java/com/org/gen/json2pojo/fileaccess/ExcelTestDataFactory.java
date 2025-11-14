/**
 * 
 */
package com.org.gen.json2pojo.fileaccess;

import java.io.File;
import java.net.URL;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import org.apache.commons.io.FileUtils;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Reads a one or more excel sheets from a base location and provide the data
 * contained in them.
 * 
 * @author Kash
 * @version 1.0
 */
public class ExcelTestDataFactory {
	private final String baseLocation;
	private static final Logger logger = LoggerFactory.getLogger(ExcelTestDataFactory.class);
	private final Collection<File> foundFiles;

	/**
	 * Initialize with base location.
	 * 
	 * @param baseLocation
	 *            file base location.
	 */
	public ExcelTestDataFactory(String baseLocation) {
		this.baseLocation = baseLocation;
		foundFiles = findAllExcelFiles(baseLocation);
	}

	@SuppressWarnings("unchecked")
	private Collection<File> findAllExcelFiles(String baseLocation) {
		
	File baseLocationFile = new File(baseLocation);
		if (!baseLocationFile.exists()) {
			baseLocationFile = loadFromClassPath(baseLocation, baseLocationFile);
			
		}
		if (!baseLocationFile.exists()) {
			logger.error("Base location file provided does not exists in the classpath/filesysten {} ",baseLocation);
			throw new DataAccessException("Error while finding baselocation "+ baseLocation);
		}
		Collection<File> excelFiles = FileUtils.listFiles(baseLocationFile,
				new String[] { "xlsx", "xls" }, true);
		logger.debug("Found excel  files to load {}",excelFiles);
		if (excelFiles.isEmpty()) {
			logger.error("No excel files found in the base location",
					baseLocation);
			throw new DataAccessException("No Excel sheet");
		}
		return excelFiles;
	}

	private File loadFromClassPath(String baseLocation, File baseLocationFile) {
		URL resource = this.getClass().getClassLoader().getResource(baseLocation);
		if (resource != null) {
			baseLocationFile = new File(resource.getFile());
		}
		return baseLocationFile;
	}

	/**
	 * @return the foundFiles
	 */
	public Collection<File> getFoundFiles() {
		return foundFiles;
	}

	/**
	 * Creates the list of data sheet based on the excel files found from the
	 * base location. The method should be fail-safe and not throw exception but
	 * return empty data sheet list.
	 * 
	 * @return list of data sheets.
	 */
	public void createAndTo(DataSheetContainer container) {
		for (File file : foundFiles) {
			try(Workbook workbook = WorkbookFactory.create(file);) {
				logger.debug("Parsing file {} available {} ", file,file.exists());
				
				int sheetNum = workbook.getNumberOfSheets();
				for (int count = 0; count < sheetNum; count++) {
					Sheet xcelSheet = workbook.getSheetAt(count);
					if (hasRows(xcelSheet)) {
						Map<String, String> dataSheetContext = new HashMap<String, String>();
						ExcelTableDatasource datasrc = new ExcelTableDatasource(
								xcelSheet);
						container.addDataSheet(new DataSheet(xcelSheet.getSheetName(),
								dataSheetContext, datasrc,
								new ExcelNativeType(),container));
					}
				}
			} catch (Exception excp) {
				excp.printStackTrace();
			    // ignore exception, allow additional data sheets to be loaded
				// if possible
				logger.error("Error while reading excel file {}",file.getAbsolutePath(), excp);
			}
		}
	}

	private boolean hasRows(Sheet xcelSheet) {
		return xcelSheet.getLastRowNum() - xcelSheet.getFirstRowNum() > 0;
	}

	/**
	 * @return the baseLocation
	 */
	public String getBaseLocation() {
		return baseLocation;
	}
}
