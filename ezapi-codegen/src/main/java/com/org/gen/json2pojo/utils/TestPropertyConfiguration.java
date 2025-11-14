package com.org.gen.json2pojo.utils;

import java.util.Properties;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This class is used to load the properties for application
 * @author Kash
 *
 */
public class TestPropertyConfiguration {
	private static final Logger logger = LoggerFactory.getLogger(TestPropertyConfiguration.class);
	private static TestPropertyConfiguration instance;
	private static Properties properties;

	public static synchronized TestPropertyConfiguration getInstance() {
		if (instance == null) {
			loadProperties();
			instance = new TestPropertyConfiguration();
		}
		return instance;
	}

	private static void loadProperties() {
		try {
			properties = new Properties();
			properties.load(TestPropertyConfiguration.class.getClassLoader().getResourceAsStream("config.properties"));
		} catch (Exception excp) {
			logger.error("Error while loading property file {}", "config.properties", excp);
		}
	}

	public String getProperty(final String key) {
		return properties.getProperty(key);
	}

	public Set<String> getAllPropertyNames() {
		return properties.stringPropertyNames();
	}

	public boolean containsKey(final String key) {
		return properties.containsKey(key);
	}

}
