package com.org.gen.json2pojo.utils;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.base.Joiner;
import com.org.gen.json2pojo.exception.DataBaseException;
import com.org.gen.json2pojo.exception.ServiceException;
import com.org.gen.json2pojo.fileaccess.TableBasedDataAccess;
import com.org.gen.json2pojo.repository.DatabaseCollectionAndQueryManager;

/**
 * @author Kash
 *
 */
public class ServiceInputUtils {
	private static final Logger logger = LoggerFactory.getLogger(ServiceInputUtils.class);
	private final Map<String, Object> stepResults;
	private final Map<String, String> saveVraiblesMap;
	private Map<String, String> dbRequestInput = new HashMap<String, String>();

	public ServiceInputUtils(Map<String, Object> stepResults, Map<String, String> saveVraiblesMap) {
		this.stepResults = stepResults;
		this.saveVraiblesMap = saveVraiblesMap;
	}

	public String updateEndPointData(Map<String, Object> testDataApiInfo, Map<String, Object> testApi, Map<String,String> tokens) {
		String endpoint = (String) testApi.get("Endpoint");
		String urlParameters = (String) testDataApiInfo.get("URLParameters");
		String queryParameters = (String) testDataApiInfo.get("QueryParameters");
		String dbQueryParameters = (String) testDataApiInfo.get("DBQueryParameters");
		TestPropertyConfiguration instance = TestPropertyConfiguration.getInstance();
		if (StringUtils.isNotEmpty(dbQueryParameters) && !StringUtils.equalsIgnoreCase(dbQueryParameters, "NA")
				&& !StringUtils.equalsIgnoreCase(dbQueryParameters, TableBasedDataAccess.EMPTY_CELL.toString())) {
			String dbName = (String) testDataApiInfo.get("Id");
			String dbenv = dbName.split(Pattern.quote("_"))[0];
			Matcher semiColonPattern = semiColonPattern(dbQueryParameters);
			String dataBaseType = TestPropertyConfiguration.getInstance().getProperty(Joiner.on(".").join(dbenv, "databaseType"));
			if (semiColonPattern.find()) {
				String[] dbSemicolon = dbQueryParameters.split(Pattern.quote(";"));
				for (int i = 0; i < dbSemicolon.length; i++) {
					String keyAndQuery = dbSemicolon[i];
					Matcher equalPattern = equalPattern(keyAndQuery);
					if (equalPattern.find()) {
						String[] keyAndQueryEqual = keyAndQuery.split(Pattern.quote("="));
						String elemnet = keyAndQueryEqual[0];
						String queryName = keyAndQueryEqual[1];
						inputQueryDetails(elemnet, dbName, dbenv, queryName, dataBaseType);
					}
				}
			} else {
				String[] keyAndQuery = dbQueryParameters.split(Pattern.quote("="));
				String elemnet = keyAndQuery[0];
				String queryName = keyAndQuery[1];
				inputQueryDetails(elemnet, dbName, dbenv, queryName, dataBaseType);
			}
		}
		String fullEndpointURL = null;
		String endPointWithInput = null;
//		if (!trueOrFalse) {
//			String baseuri = instance.getProperty("project.qa.base.uri");
//			fullEndpointURL = new StringBuilder().append(baseuri).append(endpoint).toString();
//		} else {
//			fullEndpointURL = endpoint;
//		}
		
		if(endpoint.contains("http"))
		{
			fullEndpointURL = endpoint;
		}
		else
		{			
			String uriPropKey=APIConstants.PROJECT+"."+tokens.get("ExecEnv").toLowerCase()+"."+APIConstants.BASE_URI;
			String baseuri = instance.getProperty(uriPropKey);
			fullEndpointURL = new StringBuilder().append(baseuri).append(endpoint).toString();
		}
		
		if (StringUtils.isNotEmpty(queryParameters) && !StringUtils.equalsIgnoreCase("NA", queryParameters)
				&& !StringUtils.equalsIgnoreCase(queryParameters, TableBasedDataAccess.EMPTY_CELL.toString())) {
			endPointWithInput = updateEndPointWithInput(fullEndpointURL, queryParameters);

		} else if (StringUtils.isNotEmpty(urlParameters) && !StringUtils.equalsIgnoreCase("NA", urlParameters)
				&& !StringUtils.equalsIgnoreCase(urlParameters, TableBasedDataAccess.EMPTY_CELL.toString())) {
			endPointWithInput = updateEndPointWithInput(fullEndpointURL, urlParameters);
		}
		if (StringUtils.isEmpty(endPointWithInput)) {
			endPointWithInput = fullEndpointURL;
		}
		return endPointWithInput;

	}

	public String updateRequestWithInput(String requestBodyJson, String requestBodyParameters) {
		try {
			Matcher patternMatcher = semicolonPatternMatcher(requestBodyParameters);
			if (patternMatcher.find()) {
				String[] testDataSplit = requestBodyParameters.split(Pattern.quote(";"));
				for (int i = 0; i < testDataSplit.length; i++) {
					String testDatacolumn = testDataSplit[i];
					//Matcher equalPattern = pipePattern(testDatacolumn);
					Matcher equalPattern = equalPattern(testDatacolumn);
					if (equalPattern.find()) {
						String[] equalTestDataSplit = testDatacolumn.split(Pattern.quote("="));
						String columnName = equalTestDataSplit[0];
						String columnData = equalTestDataSplit[1];
						requestBodyJson = replaceWithNewData(columnName, columnData, requestBodyJson);
					}
				}
			} else {
				Matcher equalPattern = pipePattern(requestBodyParameters);
				if (equalPattern.find()) {
					String[] equalTestDataSplit = requestBodyParameters.split(Pattern.quote("="));
					String columnName = equalTestDataSplit[0];
					String columnData = equalTestDataSplit[1];
					requestBodyJson = replaceWithNewData(columnName, columnData, requestBodyJson);
				}
			}
		} catch (Exception e) {
			throw new ServiceException("update request with new data failed", e);
		}
		return requestBodyJson;
	}

	private String replaceWithNewData(String columnName, String columnData, String requestBodyJson) {
		String savedVariableData = saveVraiblesMap.get(columnData);
		String updateDBValue = dbRequestInput.get(StringUtils.substringBetween(columnData, "[[", "]]"));
		if (StringUtils.isEmpty(savedVariableData)) {
			String actualColumnName = new StringBuilder().append("{{").append(columnName).append("}}").toString();
			if (StringUtils.isNotEmpty(requestBodyJson) && StringUtils.contains(requestBodyJson, actualColumnName)) {
				String replace = requestBodyJson.replace(actualColumnName, columnData);
				requestBodyJson = replace;
			}
		} else {
			if (StringUtils.isNotEmpty(requestBodyJson) && StringUtils.contains(requestBodyJson, columnData)) {
				String replace = requestBodyJson.replace(columnData, savedVariableData);
				requestBodyJson = replace;
			}
		}
		if (StringUtils.isNotEmpty(updateDBValue) && StringUtils.isNotEmpty(columnData) && dbRequestInput.containsKey(StringUtils.substringBetween(columnData, "[[", "]]"))) {
			if (StringUtils.contains(requestBodyJson, columnData)) {
				String replace = requestBodyJson.replace(columnData, updateDBValue);
				requestBodyJson = replace;
			}
		}
		return requestBodyJson;
	}

	private String updateEndPointWithInput(String endPointURL, String requestInput) {
		if (StringUtils.isNotEmpty(requestInput)) {
			Matcher inputMatcher = semicolonPatternMatcher(requestInput);
			if (inputMatcher.find()) {
				String[] testDataSplit = requestInput.split(Pattern.quote(";"));
				for (int i = 0; i < testDataSplit.length; i++) {
					String testDatacolumn = testDataSplit[i];
					Matcher equalPattern = equalPattern(testDatacolumn);
					if (equalPattern.find()) {
						String[] equalTestDataSplit = testDatacolumn.split(Pattern.quote("="));
						String columnName = equalTestDataSplit[0];
						String actualColumnName = new StringBuilder().append("{{").append(columnName).append("}}").toString();
						String columnData = equalTestDataSplit[1];
						String updatedData = saveVraiblesMap.get(columnName);
						String fromDbData = dbRequestInput.get(StringUtils.substringBetween(columnData, "[[", "]]"));
						if (StringUtils.isEmpty(updatedData)) {
							if (endPointURL.contains(actualColumnName)) {
								String replace = endPointURL.replace(actualColumnName, columnData);
								endPointURL = replace;
							}
						} else {
							if (endPointURL.contains(actualColumnName)) {
								String replace = endPointURL.replace(actualColumnName, updatedData);
								endPointURL = replace;
							}
						}
						if (StringUtils.isNotEmpty(fromDbData) && StringUtils.isNotEmpty(columnData) && dbRequestInput.containsKey(StringUtils.substringBetween(columnData, "[[", "]]"))) {
							if (endPointURL.contains(columnData)) {
								String replace = endPointURL.replace(columnData, fromDbData);
								endPointURL = replace;
							}
						}
					}

				}
			} else {
				Matcher equalPattern = equalPattern(requestInput);
				if (equalPattern.find()) {
					String[] equalTestDataSplit = requestInput.split(Pattern.quote("="));
					String columnName = equalTestDataSplit[0];
					String actualColumnName = new StringBuilder().append("{{").append(columnName).append("}}").toString();
					String columnData = equalTestDataSplit[1];
					String updatedData = saveVraiblesMap.get(columnData);
					String fromDbData = dbRequestInput.get(StringUtils.substringBetween(columnData, "[[", "]]"));
					if (StringUtils.isEmpty(updatedData)) {
						if (endPointURL.contains(actualColumnName)) {
							String replace = endPointURL.replace(actualColumnName, columnData);
							endPointURL = replace;
						}
					} else {
						if (endPointURL.contains(actualColumnName)) {
							String replace = endPointURL.replace(actualColumnName, updatedData);
							endPointURL = replace;
						}
					}
					if (StringUtils.isNotEmpty(fromDbData) && StringUtils.isNotEmpty(columnData) && dbRequestInput.containsKey(StringUtils.substringBetween(columnData, "[[", "]]"))) {
						if (endPointURL.contains(columnData)) {
							String replace = endPointURL.replace(columnData, fromDbData);
							endPointURL = replace;
						}
					}
				}
			}
		}
		return endPointURL;
	}

	private void inputQueryDetails(String elemnet, String dbName, String dbenv, String queryName, String dataBaseType) {
		try {
			if (StringUtils.isNotEmpty(queryName) && StringUtils.isNotEmpty(dbenv) && StringUtils.isNotEmpty(dbName)) {
				List<Map<String, String>> executeQuery = DatabaseCollectionAndQueryManager.getDefault().executeQuery(queryName, dataBaseType, dbenv);

				if (!queryName.equalsIgnoreCase("call")) {
					List<String> requestList = getElemnetKeysAsList(elemnet);
					if (CollectionUtils.isNotEmpty(executeQuery)) {
						Map<String, String> map = executeQuery.get(0);
						Set<String> keySet = map.keySet();
						if (requestList.size() == keySet.size()) {
							int count = 0;
							for (String key : keySet) {
								dbRequestInput.put(requestList.get(count), map.get(key));
								count++;
							}
						} else {
							String format = String.format("Records count/keys of request %s and count/keys of database %s are not matched", requestList, keySet);
							logger.error(format);
							String reasonText = (String) stepResults.get("failureReason");
							stepResults.put("failureReason", Joiner.on("\n").join(reasonText, format));
						}
					}
				} else {
					// Need to implement validation code for Stored Procedure
				}
			}
		} catch (Exception e) {
			throw new DataBaseException("unable to fetch data from database", e);
		}
	}

	private List<String> getElemnetKeysAsList(String elemnet) {
		return Arrays.asList(elemnet.split(Pattern.quote(",")));
	}

	private static Matcher semicolonPatternMatcher(String value) {
		Pattern compile = Pattern.compile(Pattern.quote(";"));
		return compile.matcher(value);
	}

	private static Matcher equalPattern(String value) {
		Pattern compile = Pattern.compile(Pattern.quote("="));
		return compile.matcher(value);
	}
	
	private static Matcher pipePattern(String value) {
		Pattern compile = Pattern.compile(Pattern.quote("|"));
		return compile.matcher(value);
	}

	private static Matcher semiColonPattern(String value) {
		Pattern compile = Pattern.compile(Pattern.quote(";"));
		return compile.matcher(value);
	}
}
