
package com.org.gen.json2pojo.repository;

import static com.mongodb.client.model.Filters.and;
import static com.mongodb.client.model.Filters.eq;
import static com.mongodb.client.model.Projections.excludeId;

import java.io.IOException;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Types;
import java.text.SimpleDateFormat;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Set;
import java.util.TreeMap;
import java.util.regex.Pattern;

import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.mutable.MutableInt;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.bson.types.ObjectId;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.AggregationOptions;
import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBObject;
import com.mongodb.MongoClient;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Sorts;
import com.mongodb.client.model.UpdateOptions;
import com.org.gen.json2pojo.exception.DataBaseException;
import com.org.gen.json2pojo.exception.ServiceException;
import com.org.gen.json2pojo.model.TestResultDetails;
import com.org.gen.json2pojo.model.TestRunSummary;
import com.org.gen.json2pojo.utils.APIConstants;
import com.org.gen.json2pojo.utils.ReadJsonCollection;


/**
 * @author Kash
 *
 */
public class DatabaseCollectionAndQueryManager {
	private static final Logger logger = LoggerFactory.getLogger(DatabaseCollectionAndQueryManager.class);
	private DatabaseConnectionManager connectionManager;
	private static DatabaseCollectionAndQueryManager defaultManager;
	private static final String LOCAL = "Local";
	private final static Map<String, String> properties = new ConcurrentHashMap<String, String>();

	static {
		initialize();
	}

	/**
	 * Initialize with connection manager.
	 * 
	 * @param connectionManager
	 */
	public DatabaseCollectionAndQueryManager(DatabaseConnectionManager connectionManager) {
		this.connectionManager = connectionManager;
	}

	private static void initialize() {
		logger.info("connection manager is initialized");
		try {
			defaultManager = new DatabaseCollectionAndQueryManager(new DatabaseConnectionManager());
		} catch (Exception excp) {
			throw new DataBaseException("Error while initalizing database query manager", excp);
		}
	}

	/**
	 * Get instance of the default query manager instance
	 * 
	 * @return
	 */
	public static DatabaseCollectionAndQueryManager getDefault() {
		return defaultManager;
	}

	public List<Map<String, String>> selectData(String queryName, String database, String env, int count)
			throws SQLException {
		Connection connection = null;
		PreparedStatement prepareStatement = null;
		List<Map<String, String>> resultSet = new ArrayList<Map<String, String>>();
		try {
			connection = connectionManager.getConnection(database, env);
			if (StringUtils.isNotEmpty(queryName)) {
				prepareStatement = connection.prepareStatement(DBQueries.BAN_MSISDN_QUERY);
				prepareStatement.setInt(1, count);
				ResultSet executeQuery = prepareStatement.executeQuery();
				resultSet = processResultSet(executeQuery);
			}
		} catch (Exception e) {
			throw new ServiceException("unable to select Date", e);
		} finally {
			if (null != connection && null != prepareStatement) {
				connectionManager.closeConnection(connection);
				prepareStatement.close();
			}
		}
		return resultSet;
	}

	public List<Map<String, String>> executeQuery(String queryName, String database, String env) throws Exception {
		List<Map<String, String>> resultSetMap = new LinkedList<Map<String, String>>();
		Connection connection = null;
		Statement statement = null;
		try {
			connection = connectionManager.getConnection(database, env);

			if (queryName.toLowerCase().contains("call")) {
				connection.setAutoCommit(false);
				CallableStatement stmt = connection.prepareCall(queryName);
				stmt.registerOutParameter(1, Types.OTHER);
				stmt.execute();
				ResultSet commissioned = (ResultSet) stmt.getObject(1);
				resultSetMap = processResultSet(commissioned);
			} else {

				if (StringUtils.isNotEmpty(queryName)) {
					statement = connection.createStatement();
					ResultSet resultset = statement.executeQuery(queryName);
					resultSetMap = processResultSet(resultset);
				}
			}
		} catch (Exception e) {
			throw new DataBaseException("unable to execute the query", e);
		} finally {
			if (null != connection && null != statement) {
				connectionManager.closeConnection(connection);
				statement.close();
			}
		}
		return resultSetMap;
	}
	
	

	public List<String> getTestScenariosInfo(Map<String, String> tagsMap, String dbName) {
		logger.info("Loading testscenario information{}", tagsMap);
		List<String> testScenariosList = new LinkedList<String>();
		MongoCursor<Document> mongoCursor = null;
		MongoClient mongoClient = null;
		try {
			if (!tagsMap.isEmpty()) {
				String env = tagsMap.get(APIConstants.ENVIRONMENT);
				String testCategory = tagsMap.get(APIConstants.CATEGORY_NAME);
				
				//String url = "mongodb://localhost:27017"; properties.get("local.mongodb.server");
				mongoClient = new MongoClient( properties.get("local.mongodb.server") , 27017 );
				MongoDatabase mongoDatabase = connectionManager.getConnection(mongoClient, env, dbName);
				FindIterable<Document> find = mongoDatabase
						.getCollection(connectionManager.getProperty("collection.testcase.name")).find();
				mongoCursor = find.iterator();
				while (mongoCursor.hasNext()) {
					Document document = mongoCursor.next();
					Set<String> keySet = document.keySet();
					for (String scenarioKey : keySet) {
						if (scenarioKey.equalsIgnoreCase("test_case_name")) {
						String scenarioValue = (String) document.get(scenarioKey);
						testScenariosList.add(document.get("_id").toString());						
						}
					}
				}

			}
			logger.info("Loading completed testscenario information", testScenariosList);
		} catch (Exception e) {
			throw new DataBaseException("unable to fetch scenarios details", e.fillInStackTrace());
		} finally {
			if (null != mongoCursor) {
				mongoCursor.close();
				mongoClient.close();
			}
		}
		return testScenariosList;
	}
	
	public List<Map<String, Object>> getTestCaseDetailInfo(String scenario, Map<String, String> tagsMap, String dbName, String type) {
		logger.info("Loading testcase information{} {}", tagsMap, dbName);
		List<Map<String, Object>> testCaseInfo = new LinkedList<Map<String, Object>>();
		MongoCursor<Document> mongoCursor = null;
		MongoClient mongoClient = null;
		try {
			if (!tagsMap.isEmpty()) {
				String env = tagsMap.get(APIConstants.ENVIRONMENT);
				mongoClient = connectionManager.getMongoClient(env);
				MongoDatabase mongoDatabase = connectionManager.getConnection(mongoClient, env, dbName);				
				Bson filter = eq("_id", scenario );
				FindIterable<Document> find = mongoDatabase.getCollection(connectionManager.getProperty("collection.testcase.name")).find(eq("_id", new ObjectId(scenario)));
				mongoCursor = find.iterator();
				while (mongoCursor.hasNext()) {
					Map<String, Object> testcases = new HashMap<String, Object>();
					Document document = mongoCursor.next();
					Set<Entry<String, Object>> entrySet = document.entrySet();
					for (Entry<String, Object> entry : entrySet) {
						testcases.put(entry.getKey(), entry.getValue());
					}					
					testCaseInfo.add(testcases);
				}
			

			}
			logger.info("Loading completed testcase information{}", tagsMap);
		} catch (Exception e) {
			throw new DataBaseException("unable to fetch testcase details", e.fillInStackTrace());
		} finally {
			if (null != mongoCursor) {
				mongoCursor.close();
				mongoClient.close();
			}
		}
		//System.out.println(" testCaseInfo "+ testCaseInfo.toString());
		return testCaseInfo;
	}
	
	
	public String getTestCaseAssertionData(String scenario, Map<String, String> tagsMap, String dbName, String type) {
		logger.info("Loading testcase information{} {}", tagsMap, dbName);
		String testCaseAssertionData = "";
		MongoClient mongoClient = null;
		try {
			if (!tagsMap.isEmpty()) {
				String env = tagsMap.get(APIConstants.ENVIRONMENT);
				mongoClient = connectionManager.getMongoClient(env);
				MongoDatabase mongoDatabase = connectionManager.getConnection(mongoClient, env, dbName);				
				Bson filter = eq("_id", scenario );
				Document find = mongoDatabase.getCollection(connectionManager.getProperty("collection.testcase.name")).find(eq("_id", new ObjectId(scenario))).first();
				//System.out.println("..find.."+ find.toJson());
				JSONObject jsonObj = new JSONObject(find.toJson());
				Iterator<String> keys = jsonObj.keys();
				while(keys.hasNext()) {
					String key = keys.next();
					//System.out.println("..key.."+ key);
					if (key.equalsIgnoreCase("assertionData")) {
						//System.out.println("..find.."+ jsonObj.get(key).toString());
						testCaseAssertionData = jsonObj.get(key).toString();
					}
				}
			}
			logger.info("Loading completed testcase information{}", tagsMap);
		} catch (Exception e) {
			throw new DataBaseException("unable to fetch testcase details", e.fillInStackTrace());
		} finally {
			mongoClient.close();
		}
		
		return testCaseAssertionData;
	}

	
	
	public List<Map<String, Object>> getTestCaseInputData(String scenario, Map<String, String> tagsMap, String dbName, String type) {
		logger.info("Loading testcase information{} {}", tagsMap, dbName);
		List<Map<String, Object>> testCaseInputdata = new LinkedList<Map<String, Object>>();
		MongoCursor<Document> mongoCursor = null;
		MongoClient mongoClient = null;
		try {
			if (!tagsMap.isEmpty()) {
				String env = tagsMap.get(APIConstants.ENVIRONMENT);
				mongoClient = connectionManager.getMongoClient(env);
				MongoDatabase mongoDatabase = connectionManager.getConnection(mongoClient, env, dbName);				
				Bson filter = eq("_id", scenario );
				FindIterable<Document> find = mongoDatabase.getCollection(connectionManager.getProperty("collection.testcase.name")).find(eq("_id", new ObjectId(scenario)));
				mongoCursor = find.iterator();
				while (mongoCursor.hasNext()) {
					Map<String, Object> testcases = new HashMap<String, Object>();
					Document document = mongoCursor.next();
					Set<Entry<String, Object>> entrySet = document.entrySet();
					for (Entry<String, Object> entry : entrySet) {
						if (entry.getKey().toString().equalsIgnoreCase("inputData")) {
							//System.out.println("..value.."+entry.getValue());
							Document document2 = (Document) entry.getValue();
							for (Entry<String,Object> entry2 : document2.entrySet()) {
								if (entry2.getKey().toString().equalsIgnoreCase(type)) {
									//System.out.println(".."+ type +".."+entry2.getValue());
									testcases.put(entry2.getKey(), entry2.getValue().toString());
								}
							}
						}
					}
					testCaseInputdata.add(testcases);
				}
			}
			logger.info("Loading completed testcase information{}", tagsMap);
		} catch (Exception e) {
			throw new DataBaseException("unable to fetch testcase details", e.fillInStackTrace());
		} finally {
			if (null != mongoCursor) {
				mongoCursor.close();
				mongoClient.close();
			}
		}
		//System.out.println(" testCaseInfo "+ testCaseInputdata.toString());
		return testCaseInputdata;
	}

	public List<Map<String, Object>> getTestCaseInfo(Map<String, String> tagsMap, String scenarioName) {
		logger.info("Loading testcase information{} {}", tagsMap, scenarioName);
		List<Map<String, Object>> testCaseInfo = new LinkedList<Map<String, Object>>();
		MongoCursor<Document> mongoCursor = null;
		MongoClient mongoClient = null;
		try {
			if (!tagsMap.isEmpty()) {
				String env = tagsMap.get(APIConstants.ENVIRONMENT);
				mongoClient = connectionManager.getMongoClient(env);
				MongoDatabase mongoDatabase = connectionManager.getConnection(mongoClient, env, tagsMap.get(APIConstants.DBNAME));
				
				if (StringUtils.isNotEmpty(scenarioName)) {
					Bson filter = and(eq(APIConstants.SCENARIO_NAME, scenarioName), eq("DeleteFlag", "N"));
					FindIterable<Document> find = mongoDatabase
							.getCollection(connectionManager.getProperty("collection.testcase.name")).find()
							.sort(Sorts.ascending(APIConstants.SCENARIO_ORDER)).projection(excludeId()).filter(filter);
					mongoCursor = find.iterator();
					while (mongoCursor.hasNext()) {
						Map<String, Object> testcases = new HashMap<String, Object>();
						Document document = mongoCursor.next();
						Set<Entry<String, Object>> entrySet = document.entrySet();
						for (Entry<String, Object> entry : entrySet) {
							testcases.put(entry.getKey(), entry.getValue());
						}
						testCaseInfo.add(testcases);
					}
				}

			}
			logger.info("Loading completed testcase information{}", tagsMap);
		} catch (Exception e) {
			throw new DataBaseException("unable to fetch testcase details", e.fillInStackTrace());
		} finally {
			if (null != mongoCursor && null != mongoClient) {
				mongoCursor.close();
				mongoClient.close();
			}
		}
		return testCaseInfo;
	}

	public Map<String, Object> getAPIInfo(Map<String, String> tagsMap, Map<String, Object> testCase) {
		logger.info("Loading testdataAPI information{} {}", tagsMap, testCase);
		MongoCursor<Document> mongoCursor = null;
		MongoClient mongoClient = null;
		Map<String, Object> apiInfo = new HashMap<String, Object>();
		try {
			if (!tagsMap.isEmpty()) {
				String env = tagsMap.get(APIConstants.ENVIRONMENT);
				mongoClient = connectionManager.getMongoClient(env);
				MongoDatabase mongoDatabase = connectionManager.getConnection(mongoClient, env,  tagsMap.get(APIConstants.DBNAME));
				String inventoryId = (String) testCase.get(APIConstants.APIINVENTORY_ID);
				Bson filter = and(eq(APIConstants.CONTROL_ID, inventoryId), eq("DeleteFlag", "N"));
				FindIterable<Document> find = mongoDatabase
						.getCollection(connectionManager.getProperty("collection.invetory.name")).find(filter)
						.projection(excludeId());
				mongoCursor = find.iterator();
				while (mongoCursor.hasNext()) {
					Document document = mongoCursor.next();
					Set<Entry<String, Object>> entrySet = document.entrySet();
					for (Entry<String, Object> entry : entrySet) {
						apiInfo.put(entry.getKey(), entry.getValue());
					}
				}

			}
			logger.info("Loading completed testdataAPI information", apiInfo);
		} catch (Exception e) {
			throw new DataBaseException("unable to fetch' apiinventory details", e.fillInStackTrace());
		} finally {
			if (null != mongoCursor) {
				mongoCursor.close();
				mongoClient.close();
			}
		}
		return apiInfo;
	}

	public Map<String, Object> getRequestInfo(Map<String, String> tagsMap, String testCaseName, String apiName,
			String featureName) {
		String local = tagsMap.get(LOCAL);
		MongoClient mongoClient = null;
		logger.info("Loading requests information {} {}", tagsMap, testCaseName, apiName);
		Map<String, Object> requestObject = new LinkedHashMap<String, Object>();
		if (StringUtils.isNotEmpty(local) && StringUtils.equalsIgnoreCase(local, "Y")) {
			ReadJsonCollection rjc = new ReadJsonCollection("collections");
			JsonNode jsNd = rjc.readJsonFile(featureName);
			identifyObject(jsNd.toString(), testCaseName, apiName, requestObject);
		} else {
			MongoCursor<Document> mongoCursor = null;
			try {
				if (!tagsMap.isEmpty()) {
					String env = tagsMap.get(APIConstants.ENVIRONMENT);
					mongoClient = connectionManager.getMongoClient(env);
					MongoDatabase mongoDatabase = connectionManager.getConnection(mongoClient, env,  tagsMap.get(APIConstants.DBNAME));
					FindIterable<Document> find = mongoDatabase
							.getCollection(connectionManager.getProperty("collection.request.name")).find()
							.projection(excludeId());
					mongoCursor = find.iterator();
					while (mongoCursor.hasNext()) {
						Document document = mongoCursor.next();
						identifyObject(document.toJson(), testCaseName, apiName, requestObject);

					}
				}
				logger.info("Loading completed requests information");
			} catch (Exception e) {
				throw new DataBaseException("unable to fetch request details", e.fillInStackTrace());
			} finally {
				if (null != mongoCursor) {
					mongoCursor.close();
					mongoClient.close();
				}
			}
		}
		return requestObject;
	}

	private static void identifyObject(String json, String testCaseName, String apiName,
			Map<String, Object> requestObject) {
		ObjectMapper mapper = new ObjectMapper();
		try {
			JsonNode jsonNode = mapper.readTree(json);
			if (!jsonNode.isMissingNode() && jsonNode.isObject() && jsonNode.has("item")) {
				JsonNode node = jsonNode.path("item");
				if (!node.isMissingNode() && node.isArray()) {
					for (int i = 0; i < node.size(); i++) {
						JsonNode reqNode = node.path(i);
						if (!reqNode.isMissingNode() && reqNode.has("name")
								&& (testCaseName.equalsIgnoreCase(reqNode.path("name").asText())
										|| apiName.equalsIgnoreCase(reqNode.path("name").asText())
										|| checkResponseNameInJson(reqNode, apiName))) {
							addDataToJsonObject(requestObject, reqNode, apiName);
						}
					}
				}
			}
		} catch (IOException e) {
			throw new ServiceException("unable to get request body/response body from mongo database", e);
		}
	}

	private static boolean checkResponseNameInJson(JsonNode reqNode, String apiName) {

		String reqName = null;

		if (reqNode.path("response").isArray()) {
			reqName = reqNode.path("response").get(0).path("name").asText();
		} else {
			reqName = reqNode.path("response").path("name").asText();
		}

		return reqName.equalsIgnoreCase(apiName);

	}

	private static void addDataToJsonObject(Map<String, Object> requestObject, JsonNode reqNode, String apiName) {
		if (reqNode.has("request") || reqNode.has("response")) {
			String requiredNode;
			if (apiName.toLowerCase().contains("request")) {
				requiredNode = "request";
			} else {
				requiredNode = "response";
			}
			bodyNode(requestObject, reqNode.path(requiredNode), apiName);
		}
	}

	private static void bodyNode(Map<String, Object> requestObject, JsonNode requestNode, String apiName) {

		if (apiName.toLowerCase().contains("request")) {
			if (!requestNode.isMissingNode() && requestNode.has("body")) {
				JsonNode bodynode = requestNode.path("body");

				if (!bodynode.isMissingNode() && bodynode.isObject()) {
					String mode = bodynode.path("mode").asText();
					if (mode.equals("raw")) {
						String jsonNode = bodynode.path("raw").asText();
						if (StringUtils.isNotEmpty(jsonNode)) {
							requestObject.put("body", jsonNode);
						}
					} else if (mode.equals("urlencoded")) {
						JsonNode urlEncodedBody = bodynode.path("urlencoded");
						String encodedBodyStr = "";
						if (urlEncodedBody.isArray()) {
							encodedBodyStr = itrArray(urlEncodedBody);

						} else {
							encodedBodyStr = iterateObjURLEnc(urlEncodedBody);
						}
						requestObject.put("body", encodedBodyStr);
					}

				}

			}
		} else {
			JsonNode bodyNode;
			if (!requestNode.isMissingNode()) {
				if (requestNode.isArray()) {
					bodyNode = requestNode.get(0).path("body");
				} else {
					bodyNode = requestNode.path("body");

				}

				String jsonNode = bodyNode.asText();
				if (StringUtils.isNotEmpty(jsonNode)) {
					requestObject.put("body", jsonNode);
				}
			}
		}

	}

	private static String iterateObject(JsonNode jsonNode) {
		String encodedVal = "";
		if (jsonNode.isObject()) {
			Iterator<Entry<String, JsonNode>> fields = jsonNode.fields();
			while (fields.hasNext()) {
				Entry<String, JsonNode> field = fields.next();
				String childnode = field.getValue().asText();
				encodedVal = childnode;
			}
		}
		return encodedVal;
	}
	
	private static String iterateObjURLEnc(JsonNode jsonNode) {
		Map<String, String> urlEnc= new HashMap<>();
		String jsonValue="";
		String encodedValue="";
		if (jsonNode.isObject()) {
			Iterator<Entry<String, JsonNode>> fields = jsonNode.fields();
			while (fields.hasNext()) {
				Entry<String, JsonNode> field = fields.next();
                String key = field.getKey();
				String value = field.getValue().asText();				
				if(key.equals("key"))
				{
					urlEnc.put(value, "");
				}
				
				if(key.equals("value"))
				{
					if(urlEnc.containsKey(jsonValue))
					{
			     		urlEnc.put(jsonValue, value);
					}
				}				
				if(key.equals("key"))
				{
				  jsonValue=value;
				}
	
			}

		}
		
		for(Map.Entry<String, String> encKV : urlEnc.entrySet())
		{
			String key = encKV.getKey();
			String value = encKV.getValue();
			encodedValue=encodedValue+key+"="+value+"&";
		}
		
		encodedValue = encodedValue.substring(0, encodedValue.length() - 1);

		return encodedValue;

	}

	private static String itrArray(JsonNode jsonNode) {
		String encodedBody = "";
		for (int index = 0; index < jsonNode.size(); index++) {
			JsonNode node = jsonNode.path(index);
			String encodedValue = iterateObjURLEnc(node);
			encodedBody = encodedBody+encodedValue + "&";
		}

		encodedBody = encodedBody.substring(0, encodedBody.length() - 1);

		return encodedBody;
	}

	public Map<String, Object> getTestDataInfo(Map<String, String> tagsMap, String testDataId) {
		logger.info("Loading Testdata information{} {}", tagsMap, testDataId);
		Map<String, Object> dataInfo = new LinkedHashMap<String, Object>();
		MongoCursor<Document> mongoCursor = null;
		MongoClient mongoClient = null;
		try {
			if (!tagsMap.isEmpty()) {
				String env = tagsMap.get(APIConstants.ENVIRONMENT);
				mongoClient = connectionManager.getMongoClient(env);
				MongoDatabase mongoDatabase = connectionManager.getConnection(mongoClient, env,  tagsMap.get(APIConstants.DBNAME));
				Bson filter = and(eq(APIConstants.CONTROL_ID, testDataId), eq("DeleteFlag", "N"));
				FindIterable<Document> find = mongoDatabase
						.getCollection(connectionManager.getProperty("collection.testdata.name")).find()
						.projection(excludeId()).filter(filter);
				mongoCursor = find.iterator();
				while (mongoCursor.hasNext()) {
					Document document = mongoCursor.next();
					Set<Entry<String, Object>> entrySet = document.entrySet();
					for (Entry<String, Object> entry : entrySet) {
						dataInfo.put(entry.getKey(), entry.getValue());
					}
				}

			}
			logger.info("Completed Loading Testdata information {}", dataInfo);
		} catch (Exception e) {
			throw new DataBaseException("unable to fetch testdata details from mongodatabase", e.fillInStackTrace());
		} finally {
			if (null != mongoCursor) {
				mongoCursor.close();
				mongoClient.close();
			}
		}
		return dataInfo;
	}

	public Map<String, Object> getResponseValidationInfo(Map<String, String> tagsMap, String responseValidationID) {
		logger.info("Loading response validation information {} {}", tagsMap, responseValidationID);
		Map<String, Object> responseValidationInfo = new LinkedHashMap<String, Object>();
		MongoCursor<Document> mongoCursor = null;
		MongoClient mongoClient = null;
		try {
			if (!tagsMap.isEmpty()) {
				String env = tagsMap.get(APIConstants.ENVIRONMENT);
				mongoClient = connectionManager.getMongoClient(env);
				MongoDatabase mongoDatabase = connectionManager.getConnection(mongoClient, env,  tagsMap.get(APIConstants.DBNAME));
				Bson filter = and(eq(APIConstants.CONTROL_ID, responseValidationID), eq("DeleteFlag", "N"));
				FindIterable<Document> find = mongoDatabase
						.getCollection(connectionManager.getProperty("collection.validation.name")).find()
						.filter(filter);
				mongoCursor = find.iterator();
				while (mongoCursor.hasNext()) {
					Document document = mongoCursor.next();
					Set<Entry<String, Object>> entrySet = document.entrySet();
					for (Entry<String, Object> entry : entrySet) {
						responseValidationInfo.put(entry.getKey(), entry.getValue());
					}
				}
			}
		} catch (Exception e) {
			throw new DataBaseException("unable to fetch request details", e.fillInStackTrace());
		} finally {
			if (null != mongoCursor) {
				mongoCursor.close();
				mongoClient.close();
			}
		}
		return responseValidationInfo;
	}

	public Map<String, List<Map<String, Object>>> getResultInfo(Map<String, String> tagsMap, int runId) {
		logger.info("Loading results information {} {}", tagsMap, runId);
		List<Map<String, Object>> resultList = new LinkedList<Map<String, Object>>();
		Map<String, List<Map<String, Object>>> mapOfResultList = new HashMap<String, List<Map<String, Object>>>();
		MongoCursor<Document> mongoCursor = null;
		MongoClient mongoClient = null;
		try {
			if (!tagsMap.isEmpty()) {
				String env = tagsMap.get(APIConstants.ENVIRONMENT);
				mongoClient = connectionManager.getMongoClient(env);
				MongoDatabase mongoDatabase = connectionManager.getConnection(mongoClient, env,  tagsMap.get(APIConstants.DBNAME));
				Bson filter = eq(APIConstants.RUN_ID, runId);
				FindIterable<Document> iterable = mongoDatabase
						.getCollection(connectionManager.getProperty("collection.results.name")).find()
						.projection(excludeId()).filter(filter);
				mongoCursor = iterable.iterator();
				while (mongoCursor.hasNext()) {
					Document document = mongoCursor.next();
					if (document.containsKey("ScenarioName")) {
						mapOfResultList.put(document.getString("ScenarioName"),
								addDocumnetToList(document, resultList));
					}
				}
			}
		} catch (Exception e) {
			throw new DataBaseException("unable to fetch results details", e.fillInStackTrace());
		} finally {
			if (null != mongoCursor) {
				mongoCursor.close();
				mongoClient.close();
			}
		}
		return mapOfResultList;
	}

	private List<Map<String, Object>> addDocumnetToList(Document document, List<Map<String, Object>> resultList) {
		Set<Entry<String, Object>> entrySet = document.entrySet();
		Map<String, Object> resultMap = new TreeMap<String, Object>();
		for (Entry<String, Object> entry : entrySet) {
			resultMap.put(entry.getKey(), entry.getValue());
		}
		resultList.add(resultMap);
		return resultList;
	}

	public int getMaxRunId(Map<String, String> tagsMap) {
		MongoCursor<Document> mongoCursor = null;
		int runId = 0;
		MongoClient mongoClient = null;
		try {
			if (!tagsMap.isEmpty()) {
				String env = tagsMap.get(APIConstants.ENVIRONMENT);
				mongoClient = connectionManager.getMongoClient(env);
				MongoDatabase mongoDatabase = connectionManager.getConnection(mongoClient, env,  tagsMap.get(APIConstants.DBNAME));
				FindIterable<Document> find = mongoDatabase
						.getCollection(connectionManager.getProperty("collection.results.name")).find()
						.sort(Sorts.descending(APIConstants.RUN_ID)).limit(1).projection(excludeId());
				mongoCursor = find.iterator();
				while (mongoCursor.hasNext()) {
					Document document = mongoCursor.next();
					if (document.containsKey(APIConstants.RUN_ID)) {
						runId = document.getInteger(APIConstants.RUN_ID);
					}
				}
			}
		} catch (Exception e) {
			throw new ServiceException("unable to get the run id", e);
		} finally {
			if (null != mongoCursor) {
				mongoCursor.close();
				mongoClient.close();
			}
		}
		return runId;
	}
	
	public static DBObject convertTestRunSummToBasicDBObj(TestRunSummary testRunSummary) {
		return new BasicDBObject("status", testRunSummary.getStatus())
				.append("totalexecuted", testRunSummary.getTotalExecuted())
				.append("totalpassed", testRunSummary.getTotalPassed())
				.append("totalfailed", testRunSummary.getTotalFailed())
				.append("execution_end_time", testRunSummary.getExecution_end_time());
	}
	
	public static DBObject convertTestResultsToBasicDBObj(TestResultDetails testResDetails) {
		return new BasicDBObject("runId", testResDetails.getRunId())
				.append("testcaseId", testResDetails.getTestcaseId())
				.append("test_case_name", testResDetails.getTest_case_name())				
				.append("description", testResDetails.getDescription())
				.append("resource", testResDetails.getResource())
				.append("operation_id", testResDetails.getOperation_id())
				.append("endpoint", testResDetails.getEndpoint())
				.append("method", testResDetails.getMethod())
				.append("status", testResDetails.getStatus())
				.append("reason_failure", testResDetails.getReason_failure())
				.append("executiontimestamp", testResDetails.getExectimestamp())
				.append("expectedStatus", testResDetails.getExpectedStatus());
		
	}
	
	public void writeResultstotestResults(Map<String, String> tagsMap, String dbName, TestResultDetails testResDetails) {
		logger.info("Starting writting results info into manogdb results collection {} {}", tagsMap);
		MongoClient mongodbClient = null;
		try {			
			if (!tagsMap.isEmpty()) {
				String env = tagsMap.get(APIConstants.ENVIRONMENT);				
				mongodbClient = connectionManager.getMongoClientThruURI(env);
				DB mongodbdatabase = mongodbClient.getDB(dbName);
				DBCollection mongodbcollection = mongodbdatabase.getCollection("result_details");				
				mongodbcollection.insert(convertTestResultsToBasicDBObj(testResDetails));
			}
		} catch (Exception e) {
			logger.error("Error while writting data into results collection");
			throw new ServiceException("Error while writting data into results collection", e);
		} finally {
			mongodbClient.close();
		}
	}
	
	public void writeResultsToTestRuns(Map<String, String> tagsMap, String dbName, String runId) {
		logger.info("Starting writting results info into manogdb results collection {} {}", tagsMap);
		MongoClient mongodbClient = null;
		try {			
			if (!tagsMap.isEmpty()) {
				String env = tagsMap.get(APIConstants.ENVIRONMENT);				
				mongodbClient = connectionManager.getMongoClientThruURI(env);
				DB mongodbdatabase = mongodbClient.getDB(dbName);
				DBCollection mongodbcollection = mongodbdatabase.getCollection("test_runs");
				mongodbcollection.insert(new BasicDBObject("runId", runId).append("execution_start_time", ZonedDateTime.now().toInstant().toEpochMilli()));
			}
		} catch (Exception e) {
			logger.error("Error while writing data into test runs collection");
			throw new ServiceException("Error while writing data into test runs collection", e);
		} finally {
			mongodbClient.close();
		}
	}
	
	public void writeResultsToMondoDB(List<Map<String, Object>> stepResultsList, Map<String, String> tagsMap) {
		logger.info("Starting writting results info into manogdb results collection {} {}", tagsMap, stepResultsList);
		int runId = 0;
		MongoClient mongoClient = null;
		try {
			List<Document> documentsList = new ArrayList<Document>();
			if (!tagsMap.isEmpty() && !stepResultsList.isEmpty()) {
				String env = tagsMap.get(APIConstants.ENVIRONMENT);
				mongoClient = connectionManager.getMongoClient(env);
				MongoDatabase mongoDatabase = connectionManager.getConnection(mongoClient, env,  tagsMap.get(APIConstants.DBNAME));
				MongoCollection<Document> mongoCollection = mongoDatabase.getCollection("Results");
				if (mongoCollection.countDocuments() == 0) {
					runId = 1;
				} else {
					int maxRunId = getMaxRunId(tagsMap);
					runId = maxRunId + 1;
				}
				for (Map<String, Object> stepResult : stepResultsList) {
					Document document = new Document();
					Set<String> keySet = stepResult.keySet();
					for (Object key : keySet) {
						Object object = stepResult.get(key);
						document.put((String) key, object);
					}
					document.put("RunId", runId);
					documentsList.add(document);
				}
				mongoCollection.insertMany(documentsList);
			}
		} catch (Exception e) {
			logger.error("Error while writting data into results collection");
			throw new ServiceException("Error while writting data into results collection", e);
		} finally {
			mongoClient.close();
		}
	}
	
	public void updateExecResultsInMaster(Map<String, String> tagsMap, String dbName, String queryValue, String execPercntage, String totalExecCnt, String totalPassCnt, String totalFailCnt) {
		logger.info("Starting writting results info into manogdb results collection {} {}", tagsMap);
		MongoClient mongodbClient = null;
		try {
			if (!tagsMap.isEmpty()) {
				String env = tagsMap.get(APIConstants.ENVIRONMENT);				
				mongodbClient = connectionManager.getMongoClientThruURI(env);
				DB mongodbdatabase = mongodbClient.getDB(dbName);
				DBCollection mongodbcollection = mongodbdatabase.getCollection("master");				
				BasicDBObject newdoc = new BasicDBObject();
				newdoc.append("$set", new BasicDBObject().append("percentage_executed", execPercntage).append("totalExecCount", totalExecCnt));
				BasicDBObject searchQuery = new BasicDBObject().append("dbname", queryValue);
				mongodbcollection.update(searchQuery, newdoc);				
			}
		} catch (Exception e) {
			logger.error("Error while updating execution perc to master");
			throw new ServiceException("Error while updating execution status to master collection", e);
		} finally {
			mongodbClient.close();
		}
	}

	public void updateResultsToMaster(Map<String, String> tagsMap, String dbName, String queryValue, String executionstatus) {
		logger.info("Starting writting results info into manogdb results collection {} {}", tagsMap);
		MongoClient mongodbClient = null;
		try {
			if (!tagsMap.isEmpty()) {
				String env = tagsMap.get(APIConstants.ENVIRONMENT);				
				mongodbClient = connectionManager.getMongoClientThruURI(env);
				DB mongodbdatabase = mongodbClient.getDB(dbName);
				DBCollection mongodbcollection = mongodbdatabase.getCollection("master");				
				BasicDBObject newdoc = new BasicDBObject();
				newdoc.append("$set", new BasicDBObject().append("execution_status", executionstatus));
				BasicDBObject searchQuery = new BasicDBObject().append("dbname", queryValue);
				mongodbcollection.update(searchQuery, newdoc);				
			}
		} catch (Exception e) {
			logger.error("Error while updating execution status to master");
			throw new ServiceException("Error while updating execution status to master collection", e);
		} finally {
			mongodbClient.close();
		}
	}
	
	public void updateResultsInTestRuns(Map<String, String> tagsMap, String dbName, String queryValue, TestRunSummary runSummary) {
		logger.info("Starting writting results info into manogdb results collection {} {}", tagsMap);
		MongoClient mongodbClient = null;
		try {
			if (!tagsMap.isEmpty()) {
				String env = tagsMap.get(APIConstants.ENVIRONMENT);				
				mongodbClient = connectionManager.getMongoClientThruURI(env);
				DB mongodbdatabase = mongodbClient.getDB(dbName);
				DBCollection mongodbcollection = mongodbdatabase.getCollection("test_runs");				
				BasicDBObject newdoc = new BasicDBObject();
				newdoc.append("$set", convertTestRunSummToBasicDBObj(runSummary));
				BasicDBObject searchQuery = new BasicDBObject().append("runId", queryValue);
				mongodbcollection.update(searchQuery, newdoc);				
			}
		} catch (Exception e) {
			logger.error("Error while updating execution status to master");
			throw new ServiceException("Error while updating execution status to master collection", e);
		} finally {
			mongodbClient.close();
		}
	}
	
	public void updateResultinTestResultSummary(Map<String, String> tagsMap, String dbName, String queryValue, String apiopsid) {
		Map<String, String> dataInfo = new LinkedHashMap<String, String>();
		int runNmbr=0;
		MongoClient mongoClient = null;
		MongoClient mongodbClient = null;
		try {
			if (!tagsMap.isEmpty()) {
				String env = tagsMap.get(APIConstants.ENVIRONMENT);				
				mongoClient = connectionManager.getMongoClient(env);
				MongoDatabase mongoDatabase = connectionManager.getConnection(mongoClient, env, dbName);
				MongoCollection<Document> mongoCollection = mongoDatabase.getCollection("test_runs");				
				FindIterable<Document> cursor = mongoCollection.find().sort(new BasicDBObject("execution_start_time",-1)).limit(3);
				MongoCursor<Document> iterator = cursor.iterator();
				while(iterator.hasNext()) {
					runNmbr = runNmbr+1;
					Document document = iterator.next();
					Set<Entry<String, Object>> entrySet = document.entrySet();
					for (Entry<String, Object> entry : entrySet) {
						if (entry.getKey().toString().equalsIgnoreCase("runId") ) {
							dataInfo.put("run"+runNmbr+".name", entry.getValue().toString());
						} else if (entry.getKey().toString().equalsIgnoreCase("status") || entry.getKey().toString().contains("total")) {
							dataInfo.put("run"+runNmbr+"."+entry.getKey().toString(), entry.getValue().toString());
						}						
					}
				}
				mongodbClient = connectionManager.getMongoClientThruURI(env);
				DB mongodbdatabase = mongodbClient.getDB(dbName);
				DBCollection mongodbcollection = mongodbdatabase.getCollection("test_result");
				BasicDBObject newdoc = new BasicDBObject();
				BasicDBObject newdoc1 = new BasicDBObject();				
				for (Map.Entry<String, String> entry1 : dataInfo.entrySet()) {					
					newdoc1.append(entry1.getKey().toString(), entry1.getValue().toString());
				}
				//System.out.println("newdoc1 ..."+newdoc1);
				newdoc.append("$set", newdoc1);
				//System.out.println("apiopsid ..."+apiopsid);
				BasicDBObject searchQuery = new BasicDBObject().append("api_ops_id", apiopsid);
				mongodbcollection.update(searchQuery, newdoc);				
			}
		} catch (Exception e) {
			logger.error("Error while updating execution status to master");
			throw new ServiceException("Error while updating execution status to master collection", e);
		} finally {
			mongoClient.close();
			mongodbClient.close();
		}
	}

	public void InsertIntoSankeyResultdata(Map<String, String> tagsMap, String dbName, String apiopsid, String runId) {
		Map<String, String> dataInfo = new LinkedHashMap<String, String>();
		MongoClient mongoClient = null;
		MongoClient mongodbClient = null;
		try {
			if (!tagsMap.isEmpty()) {
				String env = tagsMap.get(APIConstants.ENVIRONMENT);				
				mongoClient = connectionManager.getMongoClient(env);
				MongoDatabase mongoDatabase = connectionManager.getConnection(mongoClient, env, dbName);
				MongoCollection<Document> mongoCollection = mongoDatabase.getCollection("sankey_result_data");				
				mongodbClient = connectionManager.getMongoClientThruURI(env); 
				DB mongodbdatabase = mongodbClient.getDB(dbName);
				DBCollection mongodbcollection =  mongodbdatabase.getCollection("sankey_result_data");				 		
				Document documentFromSankey = GetSankeyData(tagsMap, dbName, apiopsid, runId);
				
				mongoCollection.insertOne(documentFromSankey);
				mongoCollection = mongoDatabase.getCollection("sankey");		
				FindIterable<Document> cursor = mongoCollection.find(new BasicDBObject("api_ops_id",apiopsid));
				MongoCursor<Document> iterator = cursor.iterator();
				while(iterator.hasNext()) {
					Document document = iterator.next();					
					Set<Entry<String, Object>> entrySet = document.entrySet();
					for (Entry<String, Object> entry : entrySet) {
						if (entry.getKey().toString().equalsIgnoreCase("data")) {
							//System.out.println(".. record "+ entry.getKey());
							Document document2 = (Document) entry.getValue();	
							//System.out.println("...."+ document2.get("graph"));
							for (Entry<String,Object> entry2 : document2.entrySet()) {
								//System.out.println("..sankey record2 "+ entry2.getKey());
								if (entry2.getKey().toString().equalsIgnoreCase("graph")) {
									//System.out.println("entered.."+entry2.getValue().toString());
									ArrayList<?> document3 = (ArrayList<?>) entry2.getValue();
									//System.out.println("//document3 .."+ document3.size());
									Document doc4 = (Document) document3.get(0);
									for (Entry<String,Object> entry3 : doc4.entrySet()) {
										if (entry3.getKey().toString().equalsIgnoreCase("nodes") ) {
											//System.out.println("..inside ddata.."+entry3.getValue());	
											MutableInt cnt = new MutableInt(0);
											ArrayList<?> document5 = (ArrayList<?>) entry3.getValue();
											document5.forEach(node -> { 
													//System.out.println("..name1.."+node.toString()+"..."+cnt);
													Document docFinal = (Document) node;
													for (Entry<String,Object> entrydocFinal : docFinal.entrySet()) {
														//System.out.println("..entrydocFinal .."+entrydocFinal.getValue());
														if (entrydocFinal.getKey().toString().equalsIgnoreCase("name") && entrydocFinal.getValue().toString().contains("status")) {
															BasicDBObject newdoc = new BasicDBObject();
															BasicDBObject newdoc1 = new BasicDBObject();
															String summVal = GetResultDataByGroupName(tagsMap, dbName, runId, entrydocFinal.getValue().toString());
															//System.out.println("..summVal..nodes.."+summVal+"..."+entrydocFinal.getValue().toString());
															newdoc1.append("data.graph.0.nodes."+cnt+".name", entrydocFinal.getValue().toString()+"#"+summVal);
															BasicDBObject searchQuery = new BasicDBObject().append("data.graph.0.nodes."+cnt+".name", entrydocFinal.getValue());
															newdoc.append("$set", newdoc1);
															mongodbcollection.update(searchQuery, newdoc);															
														}
														
													}
													cnt.increment();
												});
										} else if (entry3.getKey().toString().equalsIgnoreCase("links")) {
											ArrayList<?> document6 = (ArrayList<?>) entry3.getValue();
											MutableInt cntLink = new MutableInt(0);
											document6.forEach(link -> {
												Document docLinkFinal = (Document) link;
												for (Entry<String,Object> entrydocLinkFinal : docLinkFinal.entrySet()) {
													if (entrydocLinkFinal.getKey().toString().equalsIgnoreCase("target") && entrydocLinkFinal.getValue().toString().contains("status")) {
														//System.out.println("..entrydocLinkFinal .."+entrydocLinkFinal.getValue());	
														BasicDBObject newdocLink = new BasicDBObject();
														BasicDBObject newdocLink1 = new BasicDBObject();
														String summVal = GetResultDataByGroupName(tagsMap, dbName, runId, entrydocLinkFinal.getValue().toString());
														//System.out.println("..summVal..links.."+summVal+"..."+entrydocLinkFinal.getValue().toString());
														newdocLink1.append("data.graph.0.links."+cntLink+".target", entrydocLinkFinal.getValue().toString()+"#"+summVal);
														BasicDBObject searchQuery = new BasicDBObject().append("data.graph.0.links."+cntLink+".target", entrydocLinkFinal.getValue());
														newdocLink.append("$set", newdocLink1);
														mongodbcollection.update(searchQuery, newdocLink);
													}
												}
												cntLink.increment();
												});
										}
									}
								}
							}
						}
					}
				}
			}
		} catch (Exception e) {
			logger.error("Error while updating execution status to master");
			throw new ServiceException("Error while updating execution status to master collection", e);
		} finally {
			mongoClient.close();
			mongodbClient.close();
		}
	}

		
	public Document GetSankeyData(Map<String, String> tagsMap, String dbName, String apiopsid, String runId) {
		Document document = null;
		MongoClient mongoClient = null;
		try {
			if (!tagsMap.isEmpty()) {
				String env = tagsMap.get(APIConstants.ENVIRONMENT);				
				mongoClient = connectionManager.getMongoClient(env);
				MongoDatabase mongoDatabase = connectionManager.getConnection(mongoClient, env, dbName);
				MongoCollection<Document> mongoCollection = mongoDatabase.getCollection("sankey");				
				FindIterable<Document> cursor = mongoCollection.find(new BasicDBObject("api_ops_id",apiopsid));
				MongoCursor<Document> iterator = cursor.iterator();
				while(iterator.hasNext()) {
					document = iterator.next();
				}
				document.put("runId", runId);
				document.remove("_id");
			}
		}
		catch (Exception e) {
			logger.error("Error while updating execution status to master");
			throw new ServiceException("Error while updating execution status to master collection", e);
		}  finally {
			mongoClient.close();
		}
		return document;
	}

		
	public void InsertIntoSankeyResult(Map<String, String> tagsMap, String dbName, String apiopsid, String runId) {
		Map<String, String> dataInfo = new LinkedHashMap<String, String>();
		MongoClient mongoClient = null;
		try {
			if (!tagsMap.isEmpty()) {
				String env = tagsMap.get(APIConstants.ENVIRONMENT);				
				mongoClient = connectionManager.getMongoClient(env);
				MongoDatabase mongoDatabase = connectionManager.getConnection(mongoClient, env, dbName);
				MongoCollection<Document> mongoCollection = mongoDatabase.getCollection("sankey");				
				FindIterable<Document> cursor = mongoCollection.find(new BasicDBObject("api_ops_id",apiopsid));
				MongoClient mongodbClient = connectionManager.getMongoClientThruURI(env);
				DB mongodbdatabase = mongodbClient.getDB(dbName);
				DBCollection mongodbcollection = mongodbdatabase.getCollection("sankey");				
				MongoCursor<Document> iterator = cursor.iterator();
				while(iterator.hasNext()) {
					Document document = iterator.next();
					Set<Entry<String, Object>> entrySet = document.entrySet();
					for (Entry<String, Object> entry : entrySet) {
						if (entry.getKey().toString().equalsIgnoreCase("data")) {
							//System.out.println(".. record "+ entry.getKey());
							Document document2 = (Document) entry.getValue();	
							//System.out.println("...."+ document2.get("graph"));
							for (Entry<String,Object> entry2 : document2.entrySet()) {
								//System.out.println("..sankey record2 "+ entry2.getKey());
								if (entry2.getKey().toString().equalsIgnoreCase("graph")) {
									//System.out.println("entered.."+entry2.getValue().toString());
									ArrayList<?> document3 = (ArrayList<?>) entry2.getValue();
									//System.out.println("//document3 .."+ document3.size());
									Document doc4 = (Document) document3.get(0);
									for (Entry<String,Object> entry3 : doc4.entrySet()) {
										if (entry3.getKey().toString().equalsIgnoreCase("nodes") ) {
											//System.out.println("..inside ddata.."+entry3.getValue());	
											MutableInt cnt = new MutableInt(0);
											ArrayList<?> document5 = (ArrayList<?>) entry3.getValue();
											document5.forEach(node -> { 
													//System.out.println("..name1.."+node.toString()+"..."+cnt);
													Document docFinal = (Document) node;
													for (Entry<String,Object> entrydocFinal : docFinal.entrySet()) {
														//System.out.println("..entrydocFinal .."+entrydocFinal.getValue());
														if (entrydocFinal.getKey().toString().equalsIgnoreCase("name") && entrydocFinal.getValue().toString().contains("status")) {
															BasicDBObject newdoc = new BasicDBObject();
															BasicDBObject newdoc1 = new BasicDBObject();
															String summVal = GetResultDataByGroupName(tagsMap, dbName, runId, entrydocFinal.getValue().toString());
															newdoc1.append("data.graph.0.nodes."+cnt+".name", entrydocFinal.getValue().toString()+"#"+summVal);
															BasicDBObject searchQuery = new BasicDBObject().append("data.graph.0.nodes."+cnt+".name", entrydocFinal.getValue());
															newdoc.append("$set", newdoc1);
															mongodbcollection.update(searchQuery, newdoc);
														}														
													}
													cnt.increment();
												});
										} else if (entry3.getKey().toString().equalsIgnoreCase("links")) {
											ArrayList<?> document6 = (ArrayList<?>) entry3.getValue();
											document6.forEach(link -> {
												Document docLinkFinal = (Document) link;
												for (Entry<String,Object> entrydocLinkFinal : docLinkFinal.entrySet()) {
													//System.out.println("..entrydocLinkFinal .."+entrydocLinkFinal.getValue());													
												}
												});
										}
									}
								}
							}
						}
					}
				}
			}
		} catch (Exception e) {
			logger.error("Error while updating execution status to master");
			throw new ServiceException("Error while updating execution status to master collection", e);
		} finally {
			mongoClient.close();
		}
	}
	
	public String GetResultDataByGroupName(Map<String, String> tagsMap, String dbName, String runId, String summSpec) {
		Map<String, String> dataInfo = new LinkedHashMap<String, String>();
		int totalCnt=0;
		int passCnt=0;
		int failCnt=0;
		int nrCnt=0;
		AggregationOptions options = AggregationOptions.builder().build();
		MongoCursor<Document> mongoCursor = null;
		String execSumm = "";
		MongoClient mongoClient = null;
		//System.out.println("..summSpec.."+summSpec);
		try {
			if (!tagsMap.isEmpty()) {
				String env = tagsMap.get(APIConstants.ENVIRONMENT);				
				mongoClient = connectionManager.getMongoClient(env);
				MongoDatabase mongoDatabase = connectionManager.getConnection(mongoClient, env, dbName);
				MongoCollection<Document> mongoCollection = mongoDatabase.getCollection("result_details");				
				
				String codeVal = summSpec.split(Pattern.quote("|"))[0];
				String codeRes = summSpec.split(Pattern.quote("|"))[2];
				String codeDesc = summSpec.split(Pattern.quote("|"))[3];
				
				//System.out.println("..codeVal.."+codeVal);
				//System.out.println("..codeRes.."+codeRes);
				//System.out.println("..codeDesc.."+codeDesc);
				List<Document> caseAggregationQuery = new ArrayList<>();
				caseAggregationQuery.add(new Document("$expectedStatus", "expectedStatus"));
				caseAggregationQuery.add(new Document("$operation_id", "operation_id"));
				var query = new BasicDBObject("expectedStatus",new BasicDBObject("$eq", codeVal)).append("runId", new BasicDBObject("$eq", runId))
							.append("operation_id", new BasicDBObject("$eq", codeDesc));
							//.append("resource", new BasicDBObject("$eq", "["+codeRes+"]"));  //- revisit this. very imp
				Bson filter = and(eq("runId", runId), eq("expectedStatus", "200"), eq("operation_id","categoryQuery"),eq("resource","[categoryQuery]"));
				FindIterable<Document> find = mongoCollection.find(query).projection(excludeId());
				mongoCursor = find.iterator();				
				while (mongoCursor.hasNext()) {
					Map<String, Object> testcases = new HashMap<String, Object>();
					Document document = mongoCursor.next();
					Set<Entry<String, Object>> entrySet = document.entrySet();
					for (Entry<String, Object> entry : entrySet) {
						if (entry.getKey().equalsIgnoreCase("status")) {
							if (entry.getValue()!=null) {
								if (entry.getValue().toString().equalsIgnoreCase("Success")) {
									passCnt = passCnt + 1;
								} else {
									failCnt = failCnt + 1;
								}
							} else {
								nrCnt = nrCnt+1;
							}
						}
					}
					totalCnt = totalCnt + 1;
				}				
				execSumm = "Ex-"+totalCnt+",P-"+passCnt+",F-"+failCnt+",NR-"+nrCnt;
				//System.out.println("..insdie execSumm..."+execSumm);
			}
		} catch (Exception e) {
			logger.error("Error while updating execution status to master");
			throw new ServiceException("Error while updating execution status to master collection", e);
		} finally {
			mongoClient.close();
		}
		
		return execSumm;

	}

		
	
	private List<Map<String, String>> processResultSet(ResultSet result) throws SQLException {
		ResultSetMetaData metaData = result.getMetaData();
		List<Map<String, String>> output = new LinkedList<Map<String, String>>();
		while (result.next()) {
			Map<String, String> resultMap = new LinkedHashMap<String, String>();
			for (int count = 0; count < metaData.getColumnCount(); count++) {
				String columnName = metaData.getColumnName(count + 1);
				String value = processColumnByType(result, metaData, count + 1);
				if (StringUtils.isNotEmpty(value)) {
					resultMap.put(columnName, value);
				}
			}
			if (!resultMap.isEmpty()) {
				output.add(resultMap);
			}
		}
		return output;
	}

	private String processColumnByType(ResultSet result, ResultSetMetaData metaData, int count) throws SQLException {
		String value = "";
		switch (metaData.getColumnType(count)) {
		case Types.INTEGER:
			value = String.valueOf(result.getInt(count));
			break;
		case Types.LONGNVARCHAR:
		case Types.VARCHAR:
		case Types.CHAR:
			value = result.getString(count);
			break;
		case Types.DATE:
			value = new SimpleDateFormat().format(result.getDate(count));
			break;
		default:
			value = result.getString(count);
		}
		return value;
	}

	public List<Map<String, String>> getCollection(Map<String, String> tagsMap, String collectionName) {
		logger.info("getTestScenarioCollection information{}", tagsMap);
		List<Map<String, String>> scenariosList = new LinkedList<Map<String, String>>();
		MongoCursor<Document> mongoCursor = null;
		MongoClient mongoClient = null;
		try {
			if (!tagsMap.isEmpty()) {
				String env = tagsMap.get(APIConstants.ENVIRONMENT);
				mongoClient = connectionManager.getMongoClient(env);
				MongoDatabase mongoDatabase = connectionManager.getConnection(mongoClient, env,  tagsMap.get(APIConstants.DBNAME));
				MongoCollection<Document> collection = mongoDatabase.getCollection(collectionName);
				if (null != collection && collection.countDocuments() != 0) {
					FindIterable<Document> find = collection.find().projection(excludeId());
					mongoCursor = find.iterator();
					while (mongoCursor.hasNext()) {
						Map<String, String> scenarioMap = new LinkedHashMap<String, String>();
						Document document = mongoCursor.next();
						for (String scenarioKey : document.keySet()) {
							String key = document.get(scenarioKey).toString();
							scenarioMap.put(scenarioKey, key);
						}
						scenariosList.add(scenarioMap);
					}
				}
			}
			logger.info("getTestScenarioCollection information");
		} catch (Exception e) {
			throw new DataBaseException("unable to fetch scenarios details", e.fillInStackTrace());
		} finally {
			if (null != mongoCursor) {
				mongoCursor.close();
				mongoClient.close();
			}
		}
		return scenariosList;
	}

	public void insertOrupdateCollection(String collectionName, Map<String, String> tagsMap,
			List<Map<String, String>> ListMapsofDatasheet, Set<String> idsToBeUpdated, Set<String> dbDiffExcelIds) {
		MongoClient mongoClient = null;
		if (CollectionUtils.isNotEmpty(ListMapsofDatasheet) && StringUtils.isNotEmpty(collectionName) && null != tagsMap
				&& !tagsMap.isEmpty()) {
			List<Document> documentsList = new ArrayList<Document>();
			String env = tagsMap.get(APIConstants.ENVIRONMENT);
			mongoClient = connectionManager.getMongoClient(env);
			MongoDatabase mongoDatabase = connectionManager.getConnection(mongoClient, env,  tagsMap.get(APIConstants.DBNAME));
			MongoCollection<Document> mongoCollection = mongoDatabase.getCollection(collectionName);
			BasicDBObject bson = new BasicDBObject();
			for (int i = 0; i < ListMapsofDatasheet.size(); i++) {
				Map<String, String> stepResult = ListMapsofDatasheet.get(i);
				String controlId = stepResult.get("Id");
				if (null != idsToBeUpdated && !idsToBeUpdated.isEmpty() && idsToBeUpdated.contains(controlId)) {
					Bson filter = eq(APIConstants.CONTROL_ID, controlId);
					String deleteFlag = stepResult.get("DeleteFlag");
					if (StringUtils.isEmpty(deleteFlag)) {
						stepResult.put("DeleteFlag", "N");
					}
					bson.put("$set", stepResult);
					mongoCollection.updateMany(filter, bson, new UpdateOptions().upsert(true));
				} else if (null != dbDiffExcelIds && !dbDiffExcelIds.isEmpty() && dbDiffExcelIds.contains(controlId)) {
					updateCollection(collectionName, tagsMap, dbDiffExcelIds);
				} else {
					Document document = new Document();
					Set<String> keySet = stepResult.keySet();
					for (String key : keySet) {
						document.put(key, stepResult.get(key));
					}
					document.put("DeleteFlag", "N");
					documentsList.add(document);
				}
			}
			if (!documentsList.isEmpty()) {
				mongoCollection.insertMany(documentsList);
			}
		}
		mongoClient.close();
	}

	public void updateCollection(String collectionName, Map<String, String> tagsMap, Set<String> ids) {
		if (StringUtils.isNotEmpty(collectionName) && null != tagsMap && !tagsMap.isEmpty()) {
			String env = tagsMap.get(APIConstants.ENVIRONMENT);
			MongoClient mongoClient = connectionManager.getMongoClient(env);
			MongoDatabase mongoDatabase = connectionManager.getConnection(mongoClient, env,  tagsMap.get(APIConstants.DBNAME));
			MongoCollection<Document> mongoCollection = mongoDatabase.getCollection(collectionName);
			FindIterable<Document> find = mongoCollection.find().sort(Sorts.ascending(APIConstants.SCENARIO_ORDER))
					.projection(excludeId());
			MongoCursor<Document> mongoCursor = find.iterator();
			BasicDBObject bson = new BasicDBObject();
			while (mongoCursor.hasNext()) {
				Document document = mongoCursor.next();
				String controlId = (String) document.get("Id");
				String deleteFlag = (String) document.get("DeleteFlag");
				Bson filter = eq(APIConstants.CONTROL_ID, controlId);
				if (null != ids && !ids.isEmpty() && ids.contains(controlId)) {
					document.replace("DeleteFlag", deleteFlag, "Y");
					bson.put("$set", document);
					mongoCollection.updateMany(filter, bson, new UpdateOptions().upsert(true));
				}
			}
		}

	}
}
