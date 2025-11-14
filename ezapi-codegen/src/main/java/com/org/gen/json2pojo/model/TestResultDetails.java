package com.org.gen.json2pojo.model;

/**
 * @author Kash
 *
 */

public class TestResultDetails {

	private String runId;
	private String testcaseId;
	private String test_case_name;
	private String description;
	private String operation_id;
	private String endpoint;
	private String method;
	private String status;
	private String resource;
	private String reason_failure;
	private Long exectimestamp;
	private ExecutionTimeStamp executiontimestamp;
	private String expectedStatus;
	
	public class ExecutionTimeStamp {
		
		Long $numberLong;
		
		public Long get$numberLong() {
			return $numberLong;
		}

		public void set$numberLong(Long $numberLong) {
			this.$numberLong = $numberLong;
		}
		
		
		@Override
	    public String toString() {
	        return $numberLong.toString();
	    }
	}

	public Long getExectimestamp() {
		return exectimestamp;
	}

	public void setExectimestamp(Long exectimestamp) {
		this.exectimestamp = exectimestamp;
	}

	public String getResource() {
		return resource;
	}

	public void setResource(String resource) {
		this.resource = resource;
	}

	public String getRunId() {
		return runId;
	}

	public void setRunId(String runId) {
		this.runId = runId;
	}

	public String getTestcaseId() {
		return testcaseId;
	}

	public void setTestcaseId(String testcaseId) {
		this.testcaseId = testcaseId;
	}

	public String getTest_case_name() {
		return test_case_name;
	}

	public void setTest_case_name(String test_case_name) {
		this.test_case_name = test_case_name;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getOperation_id() {
		return operation_id;
	}

	public void setOperation_id(String operation_id) {
		this.operation_id = operation_id;
	}

	public String getEndpoint() {
		return endpoint;
	}

	public void setEndpoint(String endpoint) {
		this.endpoint = endpoint;
	}

	public String getMethod() {
		return method;
	}

	public void setMethod(String method) {
		this.method = method;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getReason_failure() {
		return reason_failure;
	}

	public void setReason_failure(String reason_failure) {
		this.reason_failure = reason_failure;
	}

	public ExecutionTimeStamp getExecutiontimestamp() {
		return executiontimestamp;
	}

	public void setExecutiontimestamp(ExecutionTimeStamp executiontimestamp) {
		this.executiontimestamp = executiontimestamp;
	}

	public String getExpectedStatus() {
		return expectedStatus;
	}

	public void setExpectedStatus(String expectedStatus) {
		this.expectedStatus = expectedStatus;
	}

	@Override
	public String toString() {
		return "TestResultDetails [runId=" + runId + ", testcaseId=" + testcaseId + ", test_case_name=" + test_case_name
				+ ", description=" + description + ", operation_id=" + operation_id + ", endpoint=" + endpoint
				+ ", method=" + method + ", status=" + status + ", resource=" + resource + ", reason_failure="
				+ reason_failure + ", executiontimestamp=" + new ExecutionTimeStamp().$numberLong + ", hashCode()=" + hashCode()
				+ ", toString()=" + super.toString() + "]";
	}
	
}
