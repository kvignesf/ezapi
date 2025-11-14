package com.org.gen.json2pojo.model;

/**
 * @author Kash
 *
 */

public class TestRunSummary {
	
//	private String runId;
	private String filename;
	private String status;
	private int totalExecuted;
	private int totalPassed;
	private int totalFailed;
	private Long execution_end_time;

	
	public Long getExecution_end_time() {
		return execution_end_time;
	}
	public void setExecution_end_time(Long execution_end_time) {
		this.execution_end_time = execution_end_time;
	}
	public String getFilename() {
		return filename;
	}
	public void setFilename(String filename) {
		this.filename = filename;
	}
	public String getStatus() {
		return status;
	}
	public void setStatus(String status) {
		this.status = status;
	}
	public int getTotalExecuted() {
		return totalExecuted;
	}
	public void setTotalExecuted(int totalExecuted) {
		this.totalExecuted = totalExecuted;
	}
	public int getTotalPassed() {
		return totalPassed;
	}
	public void setTotalPassed(int totalPassed) {
		this.totalPassed = totalPassed;
	}
	public int getTotalFailed() {
		return totalFailed;
	}
	public void setTotalFailed(int totalFailed) {
		this.totalFailed = totalFailed;
	}

}
