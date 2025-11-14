/**
 * 
 */
package com.org.gen.json2pojo.utils;

import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Collection;

import org.apache.commons.io.FileUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.org.gen.json2pojo.fileaccess.DataAccessException;

/**
 * @author Kash
 *
 */
public class ReadJsonCollection {
	private final String baseLocation;
	private final Collection<File> foundFiles;
	private static final Logger logger = LoggerFactory.getLogger(ReadJsonCollection.class);

	public ReadJsonCollection(String baseLocation) {
		this.baseLocation = baseLocation;
		foundFiles = getAllJsonFiles(baseLocation);
	}

	/**
	 * @return the foundFiles
	 */
	public Collection<File> getFoundJsonFiles() {
		return foundFiles;
	}

	@SuppressWarnings("unchecked")
	private Collection<File> getAllJsonFiles(String baseLocation) {
		File baseLocationFile = new File(baseLocation);
		if (!baseLocationFile.exists()) {
			baseLocationFile = loadFromClassPath(baseLocation, baseLocationFile);
		}
		if (!baseLocationFile.exists()) {
			logger.error("Base location file provided does not exists in the classpath/filesysten {} ", baseLocation);
			throw new DataAccessException("Error while finding baselocation " + baseLocation);
		}
		Collection<File> jsonFiles = FileUtils.listFiles(baseLocationFile, new String[] { "json" }, true);
		logger.debug("Found json  files to load {}", jsonFiles);
		if (jsonFiles.isEmpty()) {
			logger.error("No json files found in the base location", baseLocation);
			throw new DataAccessException("No Json Files");
		}
		return jsonFiles;
	}

	private File loadFromClassPath(String baseLocation, File baseLocationFile) {
		URL resource = this.getClass().getClassLoader().getResource(baseLocation);
		if (resource != null) {
			baseLocationFile = new File(resource.getFile());
		}
		return baseLocationFile;
	}

	public JsonNode readJsonFile(String featureName) {
		File jsonFile = null;
		JsonNode jsonNode = null;
		for (File file : foundFiles) {
			if (file.getPath().toLowerCase().contains(featureName.toLowerCase())) {
				jsonFile = file;
				break;
			}
		}
		byte[] jsonData;
		try {
			jsonData = Files.readAllBytes(Paths.get(jsonFile.toURI()));
			ObjectMapper mapper = new ObjectMapper();
			jsonNode = mapper.readTree(jsonData);
		} catch (IOException e) {
			e.printStackTrace();
		}
		return jsonNode;
	}

}
