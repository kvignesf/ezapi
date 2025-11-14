/**
 * 
 */
package com.org.gen.json2pojo.fileaccess;

import java.util.Calendar;
import java.util.StringTokenizer;


/**
 * Excel specific native type convertor.
 * @author Kash
 * @version 1.0
 */
public class ExcelNativeType extends GenericNativeTypeConvertor {
    
    
    /**
     * Override to handle specific format as required by excel.  Excel follow a special non standard date notation.
     */
    protected java.util.Calendar convertToCalendar(String format) {
        StringTokenizer tokenizer = new StringTokenizer(convertToString(),".");
        int days = Integer.parseInt(tokenizer.nextToken());
        Calendar cal = Calendar.getInstance();
        cal.clear();
        cal.set(1900, 0, 0);
        cal.add(Calendar.DATE, days - 1);
        return cal;
    }
}
