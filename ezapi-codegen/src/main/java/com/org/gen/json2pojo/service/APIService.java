package com.org.gen.json2pojo.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.LoggerFactory;

import com.google.common.base.Joiner;
import com.google.common.collect.Sets;
import com.org.gen.json2pojo.exception.DataBaseException;
import com.org.gen.json2pojo.fileaccess.Cell;
import com.org.gen.json2pojo.fileaccess.Column;
import com.org.gen.json2pojo.fileaccess.DataSheet;
import com.org.gen.json2pojo.fileaccess.DataSheetContainer;
import com.org.gen.json2pojo.fileaccess.ExcelTestDataFactory;
import com.org.gen.json2pojo.fileaccess.Header;
import com.org.gen.json2pojo.fileaccess.TableBasedDataAccess;
import com.org.gen.json2pojo.fileaccess.TestDataRow;
import com.org.gen.json2pojo.fileaccess.Column.ColumnType;
import com.org.gen.json2pojo.model.TestResultDetails;
import com.org.gen.json2pojo.model.TestRunSummary;
import com.org.gen.json2pojo.repository.DatabaseCollectionAndQueryManager;
import com.org.gen.json2pojo.utils.APIConstants;


/**
 * @author Kash
 *
 */
public class APIService {
	private static final org.slf4j.Logger logger = LoggerFactory.getLogger(APIService.class);
	private List<String> testScenariosInfo = null;
	//private List<Map<String,String>> testScenariosInfo = null;

	private Map<String, String> tagsMap = null;
	private static final String DATA_UPLOAD = "DataUpload";
	private static final String LOCAL = "Local";
	private static final String EXEC_ENV="ExecEnv";

	public APIService(Map<String, String> tagsMap, String dbName) {
		logger.info("Starting: Building TEST APIService..", tagsMap);
		this.tagsMap = tagsMap;
		String dataUpload = tagsMap.get(DATA_UPLOAD);
		String local = tagsMap.get(LOCAL);
		
		if (!tagsMap.isEmpty() && StringUtils.isNotEmpty(dataUpload) && StringUtils.equalsIgnoreCase(dataUpload, "Y")) {
			insertAndUpdateDataIntoMongo(tagsMap);
		}
		if (!tagsMap.isEmpty() && StringUtils.isNotEmpty(local) && StringUtils.equalsIgnoreCase(local, "Y")) {
			DataSheet dataSheet = getDataSheet("TestScenarios");
			this.testScenariosInfo = getTestScenariosFromSheet(dataSheet, tagsMap);
		} else {
			this.testScenariosInfo = DatabaseCollectionAndQueryManager.getDefault().getTestScenariosInfo(tagsMap, dbName);
		}
	}

	private List<String> getTestScenariosFromSheet(DataSheet dataSheet, Map<String, String> tagsMap) {
		List<String> scenarios = new ArrayList<String>();
		for (TestDataRow testDataRow : dataSheet) {
			Header header = testDataRow.dataSheet().header();
			Column categoryName = header.findColumn(APIConstants.CATEGORY_NAME);
			String categoryTagName = tagsMap.get(APIConstants.CATEGORY_NAME);
			Column executionControl = header.findColumn(APIConstants.EXECUTION_CONTROL);
			Column scenarioColumn = header.findColumn(APIConstants.SCENARIO_NAME);
			Cell firstValueAt = testDataRow.firstValueAt(categoryName);
			if (null != firstValueAt) {
				String cellValue = firstValueAt.getValue().toString();
				String executionControlCellValue = testDataRow.firstValueAt(executionControl).getValue().toString();
				if (StringUtils.isNotEmpty(cellValue)
						&& !StringUtils.equalsIgnoreCase(cellValue, TableBasedDataAccess.EMPTY_CELL.toString())) {
					if (StringUtils.equalsIgnoreCase(cellValue, categoryTagName)
							&& StringUtils.equalsIgnoreCase(executionControlCellValue, "Yes")) {
						scenarios.add(testDataRow.firstValueAt(scenarioColumn).getValue().toString());
					}
				}

			}
		}
		return scenarios;
	}

	public List<String> getScenarioInfo() {
		return testScenariosInfo;
	}
	
	public String getTestCaseAssertionData (String scenario, String dbName, String inputType) {
		String local = tagsMap.get(LOCAL);
		return DatabaseCollectionAndQueryManager.getDefault().getTestCaseAssertionData(scenario, tagsMap, dbName, inputType);
	
	}
	
	public List<Map<String, Object>> getAPITestCases(String scenario, String dbName, String inputType) {
		String local = tagsMap.get(LOCAL);
		return DatabaseCollectionAndQueryManager.getDefault().getTestCaseDetailInfo(scenario, tagsMap, dbName, inputType);
	}
	
	public List<Map<String, Object>> getAPITestCaseInputData(String scenario, String dbName, String inputType) {
		String local = tagsMap.get(LOCAL);
		return DatabaseCollectionAndQueryManager.getDefault().getTestCaseInputData(scenario, tagsMap, dbName, inputType);
	}

	public List<Map<String, Object>> getTestCases(String scenarioName) {
		String local = tagsMap.get(LOCAL);
		if (StringUtils.isNotEmpty(local) && StringUtils.equalsIgnoreCase(local, "Y")) {
			DataSheet dataSheet = getDataSheet("TestCases");
			return getTestCasesFromSheet(dataSheet, scenarioName);
		} else {
			return DatabaseCollectionAndQueryManager.getDefault().getTestCaseInfo(tagsMap, scenarioName);
		}

	}

	private List<Map<String, Object>> getTestCasesFromSheet(DataSheet dataSheet, String scenarioName) {
		List<Map<String, Object>> testcases = new LinkedList<Map<String, Object>>();
		Header header = dataSheet.header();
		Column deleteFlag = header.findColumn(APIConstants.DELETEFLAG);
		Column scenarioFlag = header.findColumn(APIConstants.SCENARIO_NAME);
		for (TestDataRow testDataRow : dataSheet) {
			Map<String, Object> datasheetMap = new HashMap<String, Object>();
			String deleteCellValue = testDataRow.firstValueAt(deleteFlag).getValue().toString();
			String scenarioCellValue = testDataRow.firstValueAt(scenarioFlag).getValue().toString();
			if (StringUtils.isNotEmpty(deleteCellValue) && StringUtils.equalsIgnoreCase(deleteCellValue, "N")
					&& StringUtils.isNotEmpty(scenarioCellValue)
					&& StringUtils.equalsIgnoreCase(scenarioName, scenarioCellValue)) {
				header.findColumnsOfType(ColumnType.NonControlColumn).forEach((column) -> {
					datasheetMap.putIfAbsent(column.getColumnName(),
							testDataRow.firstValueAt(column).getValue().toString());
				});
				testcases.add(datasheetMap);
			}
		}
		return testcases;
	}

	public Map<String, Object> getAPIInfo(Map<String, Object> testCase) {
		String local = tagsMap.get(LOCAL);
		if (StringUtils.isNotEmpty(local) && StringUtils.equalsIgnoreCase(local, "Y")) {
			DataSheet dataSheet = getDataSheet("APIInventory");
			String inventoryId = (String) testCase.get(APIConstants.APIINVENTORY_ID);
			return getDataFromSheet(dataSheet, inventoryId);
		} else {
			return DatabaseCollectionAndQueryManager.getDefault().getAPIInfo(tagsMap, testCase);
		}
	}

	public Map<String, Object> getRequestsAPIInfo(Map<String, Object> testStep, String apiName, String featureName) {

		String testCaseName = Joiner.on("_").join((String) testStep.get(APIConstants.TESTCASE_NAME), "Request");
		String apiNameWithRequest = Joiner.on("_").join(apiName, "Request");
		return DatabaseCollectionAndQueryManager.getDefault().getRequestInfo(tagsMap, testCaseName, apiNameWithRequest,
				featureName);

	}

	public Map<String, Object> getResponseAPIInfo(Map<String, Object> testStep, String apiName, String featureName) {
		String testCaseName = Joiner.on("_").join((String) testStep.get(APIConstants.TESTCASE_NAME), "Response");
		String apiNameWithRequest = Joiner.on("_").join(apiName, "Response");
		return DatabaseCollectionAndQueryManager.getDefault().getRequestInfo(tagsMap, testCaseName, apiNameWithRequest,
				featureName);

	}

	public Map<String, Object> getTestDataApiInfo(Map<String, Object> testStep) {
		String testDataId = (String) testStep.get("TestDataID");
		String local = tagsMap.get(LOCAL);
		if (StringUtils.isNotEmpty(local) && StringUtils.equalsIgnoreCase(local, "Y")) {
			DataSheet dataSheet = getDataSheet("TestData");
			return getDataFromSheet(dataSheet, testDataId);
		} else {
			return DatabaseCollectionAndQueryManager.getDefault().getTestDataInfo(tagsMap, testDataId);
		}
	}

	public Map<String, Object> getResponseInfo(Map<String, Object> testStep) {
		String responseValidationID = (String) testStep.get("ResponseValidationID");
		String local = tagsMap.get(LOCAL);
		if (StringUtils.isNotEmpty(local) && StringUtils.equalsIgnoreCase(local, "Y")) {
			DataSheet dataSheet = getDataSheet("ResponseValidation");
			return getDataFromSheet(dataSheet, responseValidationID);
		} else {
			return DatabaseCollectionAndQueryManager.getDefault().getResponseValidationInfo(tagsMap,
					responseValidationID);
		}
	}

	private Map<String, Object> getDataFromSheet(DataSheet dataSheet, String id) {
		Map<String, Object> testDataSheet = new LinkedHashMap<String, Object>();
		Header header = dataSheet.header();
		Column deleteFlag = header.findColumn(APIConstants.DELETEFLAG);
		Column controlIdFlag = header.findColumn(APIConstants.CONTROL_ID);
		for (TestDataRow testDataRow : dataSheet) {
			String deleteCellValue = testDataRow.firstValueAt(deleteFlag).getValue().toString();
			String controlId = testDataRow.firstValueAt(controlIdFlag).getValue().toString();
			if (StringUtils.isNotEmpty(deleteCellValue) && StringUtils.equalsIgnoreCase(deleteCellValue, "N")
					&& StringUtils.isNotEmpty(controlId) && StringUtils.equalsIgnoreCase(id, controlId)) {
				header.findColumnsOfType(ColumnType.NonControlColumn).forEach((column) -> {
					Object value = testDataRow.firstValueAt(column).getValue();
					if (null != value) {
						testDataSheet.putIfAbsent(column.getColumnName(), value.toString());
					}
				});
			}
		}
		return testDataSheet;
	}
	
	public void writeResultsToMongo(String dbName, TestResultDetails testResDetails) {
		String local = tagsMap.get(LOCAL);
			DatabaseCollectionAndQueryManager.getDefault().writeResultstotestResults(tagsMap, dbName, testResDetails);
		
	}
	
	public void writeResultsToTestRuns(String dbName, String runId) {
		String local = tagsMap.get(LOCAL);
			DatabaseCollectionAndQueryManager.getDefault().writeResultsToTestRuns(tagsMap, dbName, runId);
		
	}

	public void writeResults(List<Map<String, Object>> stepResultsList) {
		String local = tagsMap.get(LOCAL);
		if (!(StringUtils.isNotEmpty(local) && StringUtils.equalsIgnoreCase(local, "Y"))) {
			DatabaseCollectionAndQueryManager.getDefault().writeResultsToMondoDB(stepResultsList, tagsMap);
		}
	}
	
	public void updateExecPerc(String queryValue, String executionPerc, String totalExecCnt, String totalPassCnt, String totalFailCnt) {
		String local = tagsMap.get(LOCAL);
		if (!(StringUtils.isNotEmpty(local) && StringUtils.equalsIgnoreCase(local, "Y"))) {
			DatabaseCollectionAndQueryManager.getDefault().updateExecResultsInMaster(tagsMap, "ezapi", queryValue, executionPerc, totalExecCnt, totalPassCnt, totalFailCnt);
		}
	}
	
	public void updateResults(String queryValue, String executionStatus) {
		String local = tagsMap.get(LOCAL);
		if (!(StringUtils.isNotEmpty(local) && StringUtils.equalsIgnoreCase(local, "Y"))) {
			DatabaseCollectionAndQueryManager.getDefault().updateResultsToMaster(tagsMap, "ezapi", queryValue, executionStatus);
		}
	}
	
	public void updateResultsInTestRuns(String dbName, String queryValue, TestRunSummary runSummary) {
		String local = tagsMap.get(LOCAL);
		if (!(StringUtils.isNotEmpty(local) && StringUtils.equalsIgnoreCase(local, "Y"))) {
			DatabaseCollectionAndQueryManager.getDefault().updateResultsInTestRuns(tagsMap, dbName, queryValue, runSummary);
		}
	}
	
	public void updateResultinTestResultSummary(String dbName, String queryValue, String apiopsid) {
		String local = tagsMap.get(LOCAL);
		if (!(StringUtils.isNotEmpty(local) && StringUtils.equalsIgnoreCase(local, "Y"))) {
			DatabaseCollectionAndQueryManager.getDefault().updateResultinTestResultSummary(tagsMap, dbName, queryValue, apiopsid);
		}
	}
	
	public void InsertIntoSankeyResultdata(String dbName, String apiopsid, String runId) {
		String local = tagsMap.get(LOCAL);
		if (!(StringUtils.isNotEmpty(local) && StringUtils.equalsIgnoreCase(local, "Y"))) {
			DatabaseCollectionAndQueryManager.getDefault().InsertIntoSankeyResultdata(tagsMap, dbName, apiopsid, runId);
		}
	}
	

	private DataSheet getDataSheet(String sheetName) {
		String execEnv = tagsMap.get(EXEC_ENV);
		String testDataPath = "testdata"+"/"+execEnv;
		if (StringUtils.isNotEmpty(sheetName)) {
			ExcelTestDataFactory dataFactory = new ExcelTestDataFactory(testDataPath);
			DataSheetContainer container = new DataSheetContainer(new HashMap<>());
			dataFactory.createAndTo(container);
			List<DataSheet> sheetByName = container.findSheetByName(sheetName);
			return sheetByName.get(0);
		} else {
			return null;
		}
	}

	private void insertAndUpdateDataIntoMongo(Map<String, String> tagsMap) {
		try {
			String execEnv = tagsMap.get(EXEC_ENV);
			String testDataPath = "testdata"+"/"+execEnv;
			ExcelTestDataFactory dataFactory = new ExcelTestDataFactory(testDataPath);
			DataSheetContainer container = new DataSheetContainer(new HashMap<>());
			dataFactory.createAndTo(container);
			List<DataSheet> foundDataSheets = container.getDataSheets();
			if (CollectionUtils.isNotEmpty(foundDataSheets)) {
				for (DataSheet dataSheet : foundDataSheets) {
					List<Map<String, String>> listMapsOfDatasheet = new LinkedList<Map<String, String>>();
					List<Map<String, String>> listMapsOfDatabase = new LinkedList<Map<String, String>>();
					String sheetNameOrcollection = dataSheet.getName();
					Header header = dataSheet.header();
					for (TestDataRow testDataRow : dataSheet) {
						Map<String, String> datasheetMap = new HashMap<String, String>();
						header.findColumnsOfType(ColumnType.NonControlColumn).forEach((column) -> {
							String columnName = column.getColumnName();
							Cell firstValueAt = testDataRow.firstValueAt(column);
							if (null != firstValueAt && firstValueAt.getValue() != null) {
								datasheetMap.putIfAbsent(columnName, firstValueAt.getValue().toString());
							} else {
								datasheetMap.putIfAbsent(columnName, "");
							}
						});
						listMapsOfDatasheet.add(datasheetMap);
					}
					listMapsOfDatabase = DatabaseCollectionAndQueryManager.getDefault().getCollection(tagsMap,
							sheetNameOrcollection);
					int sheetsize = listMapsOfDatasheet.size();
					int dbsize = listMapsOfDatabase.size();
					Set<String> dbIds = listMapsOfDatabase.stream().map(map -> map.get("Id"))
							.collect(Collectors.toSet());
					Set<String> excelIds = listMapsOfDatasheet.stream().map(map -> map.get("Id"))
							.collect(Collectors.toSet());
					Set<String> idsToBeUpdated = Sets.intersection(dbIds, excelIds);
					List<Map<String, String>> listMapsOfdatasheet = loadDatasheets(listMapsOfDatasheet);
					Set<String> dbDiffExcelIds = Sets.difference(dbIds, excelIds);
					DatabaseCollectionAndQueryManager.getDefault().insertOrupdateCollection(sheetNameOrcollection,
							tagsMap, listMapsOfdatasheet, idsToBeUpdated, dbDiffExcelIds);
					if (sheetsize < dbsize) {
						Set<String> updateDbIds = Sets.difference(dbIds, idsToBeUpdated);
						DatabaseCollectionAndQueryManager.getDefault().updateCollection(sheetNameOrcollection, tagsMap,
								updateDbIds);
					}
				}
			}
		} catch (Exception e) {
			throw new DataBaseException("unable to inser data from datasheet", e.fillInStackTrace());
		}
	}

	private List<Map<String, String>> loadDatasheets(List<Map<String, String>> scenariosList) {
		List<Map<String, String>> matchingListMap = scenariosList.stream()
				.map(map -> map.entrySet().stream().collect(Collectors.toMap(e -> e.getKey(), p -> p.getValue())))
				.filter(m -> !m.isEmpty()).collect(Collectors.toList());
		return matchingListMap;
	}

}
