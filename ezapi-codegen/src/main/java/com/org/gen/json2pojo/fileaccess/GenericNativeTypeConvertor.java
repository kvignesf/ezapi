/**
 * 
 */
package com.org.gen.json2pojo.fileaccess;

import java.text.NumberFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;

/**
 * Generic implementation of the native type useful where the underlying type is same or very similar to java type e.g database. Implementors of native type can
 * extend the class and override specific 'convert' methods to do special type conversions. This class is not thread safe and is mutable, the reason is that
 * most popular usage of the class will be within a method alone.
 * 
 * @author Kash
 * @version 1.0
 */
public class GenericNativeTypeConvertor implements NativeTypeConvertor {
    protected Object nativeType;

    /**
     * @return the nativeType
     */
    public Object getNativeType() {
        return nativeType;
    }

    /**
     * @param nativeType
     *            the nativeType to set
     */
    public GenericNativeTypeConvertor nativeType(Object nativeType) {
        this.nativeType = nativeType;
        return this;
    }

    /**
     * Converts the given native type to string.
     * 
     * @return
     */
    protected String convertToString() {
        return nativeType.toString();
    }

    /**
     * Converts the given native type to integer.
     * 
     * @return
     */
    protected Integer convertToInteger() {
        NumberFormat format = NumberFormat.getInstance();
        format.setParseIntegerOnly(true);
        try {
            return (int) format.parse(convertToString()).intValue();
        } catch (ParseException excp) {
            throw new IllegalArgumentException("Error while coverting the test data", excp);
        }
    }

    /**
     * Converts the given native type to double.
     * 
     * @return
     */
    protected Double convertToDouble() {
        return Double.valueOf(convertToString());
    }

    /**
     * Converts the given native type to string.
     * 
     * @return
     */
    protected Calendar convertToCalendar(String format) {
        Calendar cal = Calendar.getInstance();
        try {
            cal.setTime(new SimpleDateFormat(format).parse(convertToString()));
        } catch (ParseException e) {
            throw new IllegalArgumentException("Cannot format the given field to the date format " + nativeType + " format " + format);
        }
        return cal;
    }

    /**
     * Gets as string.
     */
    public String asString() {
        return convertToString();
    }

    /**
     * Get as integer.
     */
    public int asInt() {
        return convertToInteger();
    }

    /**
     * Get as calendar.
     */
    public Calendar asCalendar(String format) {
        return convertToCalendar(format);
    }

    /**
     * Get as double
     */
    public double asDouble() {
        return convertToDouble();
    }

}
