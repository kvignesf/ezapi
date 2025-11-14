package com.org.gen.json2pojo.repository;

/**
 * @author Kash
 *
 */

public class DBQueries {
	
	private DBQueries(){
		
	}
	public static final String BAN_MSISDN_QUERY ="select b.BAN,a.SUBSCRIBER_NO " + 
			"from Subscriber a, billing_account b" + 
			"where a.CUSTOMER_ID = b.BAN " + 
			"and b.ban_status='T'"
			+"and ROWNUM <=? order by b.sys_creation_date desc";
}