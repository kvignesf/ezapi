package com.org.gen.json2pojo.utils;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Iterator;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.org.gen.json2pojo.exception.ServiceException;

/**
 * @author Kash
 *
 */
public class ParsingUtils {
	
	private Map<String, String> responseJsonMap;
	private String childKey = null;

	
	public Map<String, String> createMapFromResponse(String response) {
		//System.out.println("..incoming response.."+response);
		responseJsonMap = new LinkedHashMap<String, String>();
		try {
			ObjectMapper mapper = new ObjectMapper();
			if (null != response) {
				JsonNode readTree = mapper.readTree(response);
				if (!readTree.isMissingNode()) {
					iterateObject(readTree);
				}
			}
		} catch (IOException e) {
			if (response.equals("OK")) {
				;
				responseJsonMap.put("response", response.toString());
			} else {
				throw new ServiceException("unable to parse json object", e);
			}
		}
		return responseJsonMap;

	}
	
	
	private void iterateObject(JsonNode jsonNode) {

		if (jsonNode.isObject()) {

			Iterator<Entry<String, JsonNode>> fields = jsonNode.fields();
			while (fields.hasNext()) {
				Entry<String, JsonNode> field = fields.next();
				childKey = field.getKey();
				JsonNode childnode = field.getValue();
				if (childnode.isObject()) {
					iterateObjectForJObject(childnode, childKey);
				} else if (childnode.isArray()) {
					itrArray(childnode, childKey);
				} else {
					responseJsonMap.put(childKey, childnode.asText());
				}

			}

		} else if (jsonNode.isArray()) {
			itrArray(jsonNode, childKey);
		}

	}

	private void iterateObjectForJObject(JsonNode jsonNode, String childKey) {
		if (jsonNode.isObject()) {

			Iterator<Entry<String, JsonNode>> fields = jsonNode.fields();
			while (fields.hasNext()) {
				Entry<String, JsonNode> field = fields.next();
				String childKeyNew = field.getKey();
				JsonNode childnode = field.getValue();
				if (childnode.isObject()) {
					iterateObjectForJObject(childnode, childKey + "." + childKeyNew);
				} else if (childnode.isArray()) {
					itrArray(childnode, childKey + "." + childKeyNew);
				} else {
					responseJsonMap.put(childKey + "." + childKeyNew, childnode.asText());
				}

			}

		} else if (jsonNode.isArray()) {

			itrArray(jsonNode);
		} else {
			responseJsonMap.put(childKey, jsonNode.asText());
		}

	}
	
	
	private void iterateObjectForArray(JsonNode jsonNode, String childKey, int counter) {
		if (jsonNode.isObject()) {

			Iterator<Entry<String, JsonNode>> fields = jsonNode.fields();
			while (fields.hasNext()) {
				Entry<String, JsonNode> field = fields.next();
				String childKeyNew = field.getKey();
				JsonNode childnode = field.getValue();
				if (childKey == null) {
					if (childnode.isObject()) {
						iterateObjectForJObject(childnode, childKeyNew + "[" + counter + "]");
					} else if (childnode.isArray()) {
						itrArray(childnode, childKeyNew + "[" + counter + "]");
					} else {
						responseJsonMap.put(childKeyNew + "[" + counter + "]", childnode.asText());
					}
				} else {
					if (childnode.isObject()) {
						iterateObjectForJObject(childnode, childKey + "[" + counter + "]." + childKeyNew);
					} else if (childnode.isArray()) {
						itrArray(childnode, childKey + "[" + counter + "]." + childKeyNew);
					} else {
						responseJsonMap.put(childKey + "[" + counter + "]." + childKeyNew, childnode.asText());
					}
				}

			}

		} else if (jsonNode.isArray()) {
			itrArray(jsonNode, childKey);
		}

		else {
			responseJsonMap.put(childKey + "[" + counter + "]", jsonNode.asText());
		}

	}

	private void itrArray(JsonNode jsonNode, String childKey) {
		if (null != childKey) {
			for (int index = 0; index < jsonNode.size(); index++) {
				JsonNode node = jsonNode.path(index);
				iterateObjectForArray(node, childKey, index);
			}
		} else {
			for (int index = 0; index < jsonNode.size(); index++) {
				JsonNode node = jsonNode.path(index);
				iterateObjectForArray(node, childKey, index);
			}
		}
	}

	private void itrArray(JsonNode jsonNode) {
		System.out.println("No Child Keys " + jsonNode);
		for (int index = 0; index < jsonNode.size(); index++) {
			JsonNode node = jsonNode.path(index);
			iterateObject(node);
		}
	}


}
