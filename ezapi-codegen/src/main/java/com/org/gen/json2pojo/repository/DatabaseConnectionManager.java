package com.org.gen.json2pojo.repository;

import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

import org.apache.commons.lang3.StringUtils;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.base.Joiner;
import com.mongodb.MongoClient;
import com.mongodb.MongoClientURI;
import com.mongodb.QueryBuilder;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.org.gen.json2pojo.exception.DataBaseException;
import com.org.gen.json2pojo.exception.ServiceException;


/**
 * @author Kash
 *
 */
public class DatabaseConnectionManager {
	private static final Logger logger = LoggerFactory.getLogger(DatabaseConnectionManager.class);
	private final static Map<String, String> properties = new ConcurrentHashMap<String, String>();
	private static final String MONGO = "mongodb";

	/**
	 * Intialize the database manager
	 */
	public DatabaseConnectionManager() {
		logger.info("Startedloading database properties");
		Properties props = new Properties();
		try {
			props.load(this.getClass().getClassLoader().getResourceAsStream("datasource.properties"));
		} catch (IOException excp) {
			throw new ServiceException("Error while initialization test data sources", excp);
		}
		Set<Object> keySet = props.keySet();
		for (Object key : keySet) {
			properties.put((String) key, (String) props.get(key));
		}
		logger.info("complated database properties loading");
	}

	public MongoClient getMongoClient(String environment) {
		logger.info("Started getting mongo client {} ", environment);
		String serverJoin = Joiner.on(".").join(getEnv(environment), MONGO, "server");
		String portnumberJoin = Joiner.on(".").join(getEnv(environment), MONGO, "portnumber");
		String server = properties.get(serverJoin);
		int port = Integer.parseInt(properties.get(portnumberJoin));
		//System.out.println("...port..."+port+".."+server);
		return new MongoClient(server, port);
		//return new MongoClient(new MongoClientURI("mongodb://"+server+":"+port));
	}
	
	public MongoClient getMongoClientThruURI(String environment) {
		logger.info("Started getting mongo client {} ", environment);
		String serverJoin = Joiner.on(".").join(getEnv(environment), MONGO, "server");
		String portnumberJoin = Joiner.on(".").join(getEnv(environment), MONGO, "portnumber");
		String server = properties.get(serverJoin);
		int port = Integer.parseInt(properties.get(portnumberJoin));
		//System.out.println("...port..."+port+".."+server);
		//return new MongoClient(server, port);
		return new MongoClient(new MongoClientURI("mongodb://"+server+":"+port));
	}

	public MongoDatabase getConnection(MongoClient mongoClient, String environment, String dbName) {
		logger.info("Started getting mongo connection {} {}", mongoClient, environment);
		try {
			//String dbJoin = Joiner.on(".").join(getEnv(environment), MONGO, "database");
			//String dbName = properties.get(dbJoin);
			return mongoClient.getDatabase(dbName);
		} catch (Exception e) {
			throw new DataBaseException("unable to get db details", e.fillInStackTrace());
		}
	}

	private String getEnv(String environment) {
		if (StringUtils.isEmpty(environment)) {
			environment = "local";
		}
		return environment;
	}

	public MongoCollection<Document> getDBCoolection(MongoDatabase mongoDatabase, String collectionName) {
		logger.info("Started getting connection", mongoDatabase, collectionName);
		return mongoDatabase.getCollection(collectionName);
	}

	public QueryBuilder createMongoQueryBuilder(String key, int val) {
		QueryBuilder objectToFind = QueryBuilder.start();
		return objectToFind.and(key).is(val);
	}

	public QueryBuilder createMongoQueryBuilder(Map<Object, Object> queryKeyValueMap) {
		QueryBuilder objectToFind = QueryBuilder.start();
		if (!queryKeyValueMap.isEmpty()) {
			Set<Object> keySet = queryKeyValueMap.keySet();
			for (Object key : keySet) {
				objectToFind.and((String) key)
						.regex(Pattern.compile("^" + queryKeyValueMap.get(key) + "$", Pattern.CASE_INSENSITIVE));
			}
		}
		return objectToFind;
	}

	public void closeConnection(MongoClient mongo) {
		if (null != mongo) {
			mongo.close();
		}
	}

	/**
	 * Retrieves a connection from the database
	 * 
	 * @param dbName
	 * @param env
	 * @return
	 */
	public Connection getConnection(String dbName, String env) {
		try {
			if (StringUtils.isEmpty(env)) {
				env = "local";
			}
			String key = dbName != null ? (env + "." + dbName) : env;

			return DriverManager.getConnection(properties.get(key + ".url"), properties.get(key + ".username"),
					properties.get(key + ".password"));

		} catch (SQLException sexcp) {
			throw new DataBaseException("Error while creating a connection for " + dbName, sexcp);
		}
	}

	/**
	 * Closes the given connection
	 * 
	 * @param conn
	 */
	public void closeConnection(Connection conn) {
		try {
			if (conn != null) {
				conn.close();
			}
		} catch (SQLException excp) {
			throw new DataBaseException("Error while closing the connection", excp);
		}
	}

	public String getProperty(String tableName) {
		return properties.get(tableName);
	}
}
