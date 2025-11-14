package com.org.gen.json2pojo.controller;

import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.ContentCachingRequestWrapper;

import com.org.gen.json2pojo.model.DTOGenDriver;
import com.org.gen.json2pojo.model.ServiceDriver;
import com.org.gen.json2pojo.service.APIService;
import com.org.gen.json2pojo.utils.ParsingUtils;

/**
 * @author Kash
 *
 */

@RestController
public class GenPojoController {

	private ServiceDriver serviceDriver = new ServiceDriver();
	private DTOGenDriver genDriver = new DTOGenDriver();
	public Map<String, Map<String, String>> totalScenarios;
	private APIService apiservice;
	public static Map<String, String> testCaseLevelDetails;
    private static final Logger logger = LoggerFactory.getLogger(GenPojoController.class);

	@GetMapping(value="/testgen")
	public String runSamplegen() {
		return "success go ahead !";
	}

	//@Async
	@RequestMapping(value = "/{schema}/gendtopojos")
	public @ResponseBody ResponseEntity executeAPITests(HttpServletRequest servletRequest, @PathVariable("schema") String schema, @RequestBody com.fasterxml.jackson.databind.JsonNode payLoad)
			throws Exception {
		ContentCachingRequestWrapper req = new ContentCachingRequestWrapper(servletRequest);
		ResponseEntity respEntity = null;

		String verb = req.getMethod();
		logger.info("request paylad" + payLoad);
		logger.info("request paylad path" + payLoad.get("path"));
		//Map<String, String> reqInputTokens = new ParsingUtils().createMapFromResponse(payLoad);
		Map<String, String> reqInputTokens = new HashMap<>();
		reqInputTokens.put("schema", schema);
		logger.info("reqInputTokens paylad" + reqInputTokens.toString());
		//apiservice = new APIService(reqInputTokens, schema);

		String msg = genDriver.updateInputFile(payLoad.get("path"), reqInputTokens);
		//System.out.println("testCaseLevelDetails..."+ testCaseLevelDetails);
		respEntity= ResponseEntity.status(HttpStatus.OK).body("Success");			

		return respEntity; 
	}

	
	@RequestMapping(value = "/gendtopojos")
	public @ResponseBody ResponseEntity generatePojos(HttpServletRequest servletRequest, @RequestBody com.fasterxml.jackson.databind.JsonNode payLoad)
			throws Exception {
		ContentCachingRequestWrapper req = new ContentCachingRequestWrapper(servletRequest);
		ResponseEntity respEntity = null;

		String verb = req.getMethod();
		logger.info("request paylad" + payLoad);
		logger.info("request paylad path" + payLoad.get("path").get("properties"));
		logger.info("project id" + payLoad.get("projectid"));
		logger.info("name" + payLoad.get("name"));

		//Map<String, String> reqInputTokens = new ParsingUtils().createMapFromResponse(payLoad);
		Map<String, String> reqInputTokens = new HashMap<>();
		reqInputTokens.put("projectid", payLoad.get("projectid").toString());
		reqInputTokens.put("name", payLoad.get("name").toString());
		//apiservice = new APIService(reqInputTokens, schema);
		logger.info("reqInputTokens paylad" + reqInputTokens.toString());
		
		if (isNullOrEmpty(payLoad.get("path").toString())) {
		if (isNullOrEmpty(payLoad.get("path").get("properties").toString())) {
			
		}
		}

		String msg = genDriver.updateInputFile(payLoad.get("path").get("properties"), reqInputTokens);
		//System.out.println("testCaseLevelDetails..."+ testCaseLevelDetails);
		respEntity= ResponseEntity.status(HttpStatus.OK).body(msg);			

		return respEntity; 
	}
	
	private static boolean isNullOrEmpty(String str){
	    if(str == null || str.isEmpty())
	      return true;
	    return false;
	  }

	@RequestMapping(value = "/genJavaCode")
	public @ResponseBody ResponseEntity generateJavaCode(HttpServletRequest servletRequest, @RequestBody String payLoad)
			throws Exception {
		ContentCachingRequestWrapper req = new ContentCachingRequestWrapper(servletRequest);
		ResponseEntity respEntity = null;
		Map<String, String> reqInputTokens = new ParsingUtils().createMapFromResponse(payLoad);
		String verb = req.getMethod();
		String projId = reqInputTokens.get("projectid").toString();
		String outputFile = reqInputTokens.get("outputFile").toString();
		logger.info("..projId.."+ projId +"...outputFile.."+outputFile);
		//respEntity= ResponseEntity.status(HttpStatus.OK).body(msg);			
		String msg = genDriver.genJavaCodeThruJHip(projId, outputFile);
		respEntity= ResponseEntity.status(HttpStatus.OK).body(msg);	
		logger.info("respEntity.."+respEntity);
		return respEntity;
	}
}
