package com.org.gen.json2pojo.fileaccess;

import java.util.Calendar;

/**
 * Represents a native type corresponding to the data source. The native type needs to be converted to Java type using
 * one of 'get' methods. Implementations will provide algorithm the native type to Java type. e.g. excel date. Types
 * currently supported are int, string, double, Calendar. The native type should be of the relevant type or convertable
 * to the relevant type to enable conversion e.g. cannot convert a integer to calendar as results may be unpredictable.
 * 
 * @author Kash
 * @version 1.0
 */
public interface NativeTypeConvertor {

    /**
     * Return the value as string.
     * @return
     */
    public String asString();

    /**
     * Return the value as integer.
     * @return
     */
    public int asInt();

    /**
     * Return the value as calendar.
     * @param date format
     * @return
     */
    public Calendar asCalendar(String format);
    
    /**
     * Return the value as double.
     * @return
     */
    public double asDouble();
    
    
    /**
     * sets the given native type to be converted. The method supports chaining for easier manipulation.
     * @param nativeType
     */
    public NativeTypeConvertor nativeType(Object nativeType);

}
