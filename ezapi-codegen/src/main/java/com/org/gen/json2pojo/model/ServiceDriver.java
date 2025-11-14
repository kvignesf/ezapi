package com.org.gen.json2pojo.model;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.jsonschema2pojo.DefaultGenerationConfig;
import org.jsonschema2pojo.GenerationConfig;
import org.jsonschema2pojo.Jackson2Annotator;
import org.jsonschema2pojo.SchemaGenerator;
import org.jsonschema2pojo.SchemaMapper;
import org.jsonschema2pojo.SchemaStore;
import org.jsonschema2pojo.SourceType;
import org.jsonschema2pojo.rules.RuleFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;

import com.fasterxml.jackson.databind.JsonNode;
import com.org.gen.json2pojo.utils.ServiceInputUtils;
import com.squareup.okhttp.Response;
import com.sun.codemodel.JCodeModel;

/**
 * @author Kash
 *
 */
public class ServiceDriver {
	private static final Logger logger = LoggerFactory.getLogger(ServiceDriver.class);
	private Response response;
	private SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.mmm");
	private List<Map<String, Object>> stepResultsList = new LinkedList<>();
	private Map<String, Object> stepResults;
	private ServiceInputUtils serviceInputUtils;
	private Map<String, String> saveVariablesMap = new LinkedHashMap<String, String>();
	public static Map<String, List<Map<String, Object>>> reportDetails = new LinkedHashMap<>();
	public static List<Map<String, Object>> listDet = new LinkedList<>();
	public Map<String, String> totalTestCases;
	public static Map<String, Map<String, String>> totalScenarios;
	public String fileName = "";
	public String testCaseName = "";
	public String testcaseid = "";
	public String uri = "";
    public String method = "";
    public String operationId = "";
    public String description = "";
    public String resourceDetails = "";
    public String runId = "";
    public String failureReason = "";
    public String overallExecutionStatus = "";
    public String apiopsid = "";
    public String expectedStatus = "";
    public String actualStatusSF = "Fail";
    
    public String totalTestCaseCnt = "";
    public int totalExecCaseCnt = 0;
    public int totalPassCaseCnt = 0;
    public int totalFailCaseCnt = 0;
    public int execPerc = 0;
	
	
	
	
	private String updateDynamicParams(String value) {
		if (StringUtils.isNotEmpty(value)) {
			String[] substringsBetween = StringUtils.substringsBetween(value, "{{", "}}");
			if (null != substringsBetween) {
				for (int i = 0; i < substringsBetween.length; i++) {
					String data = substringsBetween[i];
					String actualData = new StringBuilder().append("{{").append(data).append("}}").toString();
					if (StringUtils.isNoneEmpty(data) && value.contains(actualData)) {
						String replace = value.replace(actualData, saveVariablesMap.get(actualData));
						value = replace;
					}
				}
			}
		}
		return value;
	}
	
	private String getConcatStringFromArray(String[] strArrResource) {

		String delimiter = ",-";
		StringBuilder sb = new StringBuilder();
		for ( String element : strArrResource ) {
			if (sb.length() > 0) {
				sb.append( delimiter );
			}
			sb.append( element );
		}
		String theString = sb.toString();
		//System.out.println( theString );
		return theString;
	}
	
	public String updateInputFile(JsonNode payLoadInput, Map<String, String> reqInputTokens) {
		String oldContent = "";
        FileWriter writer = null;
        BufferedReader reader = null;
		try {
			File baseLocationofFile = getBaseLocation("src/main/resources");

		File fileToBeModified = new ClassPathResource("schemas/input.json", this.getClass().getClassLoader()).getFile();
		File fileGenerated = new ClassPathResource("schemas/output.json", this.getClass().getClassLoader()).getFile();
		File fileGenerated2 = new File(baseLocationofFile + File.separator + "schemas" + File.separator + reqInputTokens.get("schema") + ".json");
		fileGenerated2.createNewFile();
		System.out.println("..fileGenerated.."+fileGenerated);        
        reader = new BufferedReader(new FileReader(fileToBeModified));
        //Reading all the lines of input text file into oldContent         
        String line = reader.readLine();
        while (line != null) 
            {
        		oldContent = oldContent + line + System.lineSeparator();        		
        		line = reader.readLine();
            }
        System.out.println(".new.." + payLoadInput);
        String newContent = oldContent.replaceAll("replace", payLoadInput.toString());
        //System.out.println("newContent.."+new JSONObject(newContent));
		/*
		 * if (line.contains("replace")) { System.out.println("line..."+line); }
		 */
        JSONParser parser = new JSONParser();
        JSONObject jsonobj = (JSONObject) parser.parse(newContent);
        System.out.println("..jsonobj.." + jsonobj.toString());
        writer = new FileWriter(fileGenerated);
        //writer.write(jsonobj.);
        Files.write(Paths.get(fileGenerated2.toURI()), jsonobj.toJSONString().getBytes());
        //writer = new FileWriter(fileGenerated2);
        //writer.write(newContent);
        
        String packageName = "com.ezapi";
		// File inputJson= new File("."+File.separator+"input.json");
		
		System.out.println("...resource.."+fileGenerated.toURI().toURL() + ".." + fileGenerated.getName());
		File inputJson = new File(baseLocationofFile + File.separator + "schemas" + File.separator + "output.json");
		File outputPojoDirectory = new File(baseLocationofFile + File.separator + "convertedPojo");
		outputPojoDirectory.mkdirs();
		try {
			//new JsonToPojo().convert2JSON(inputJson.toURI().toURL(), outputPojoDirectory, packageName, inputJson.getName().replace(".json", ""));
			convert2JSON(fileGenerated2.toURI().toURL(), outputPojoDirectory, packageName, fileGenerated2.getName().replace(".json", ""));
		} catch (IOException e) {
			// TODO Auto-generated catch block
			System.out.println("Encountered issue while converting to pojo: " + e.getMessage());
			e.printStackTrace();
		}
        
        }
        catch (Exception e) {
        	e.printStackTrace();
        }
		finally
        {
            try
            {
                //Closing the resources                 
                reader.close();                 
                writer.close();
                
            } 
            catch (IOException ex) 
            {
                ex.printStackTrace();
            }
        }
        return "success";
	}
	
	public void convert2JSON(URL inputJson, File outputPojoDirectory, String packageName, String className)
			throws IOException {
		JCodeModel codeModel = new JCodeModel();
		URL source = inputJson;
		GenerationConfig config = new DefaultGenerationConfig() {
			@Override
			public boolean isGenerateBuilders() { // set config option by overriding method
				return true;
			}

			public SourceType getSourceType() {
				return SourceType.JSONSCHEMA;
			}
		};
		SchemaMapper mapper = new SchemaMapper(
				new RuleFactory(config, new Jackson2Annotator(config), new SchemaStore()), new SchemaGenerator());
		mapper.generate(codeModel, className, packageName, source);
		codeModel.build(outputPojoDirectory);
	}

	public static File getBaseLocation(String folderName) {
		File baseLocationFile = new File(folderName);
		if (!baseLocationFile.exists()) {
			baseLocationFile = loadFromClassPath(folderName, baseLocationFile);
		}
		if (!baseLocationFile.exists()) {
			System.out
					.println("Base location file provided does nt exists in the classpath/filesystem {}" + folderName);
		}
		return baseLocationFile;
	}

	private static File loadFromClassPath(String baseLocation, File baseLocationFile) {

		URL resource = ServiceDriver.class.getClassLoader().getResource(baseLocation);
		if (resource != null) {
			baseLocationFile = new File(resource.getFile());
		}
		return baseLocationFile;
	}

}
