package com.org.gen.json2pojo.fileaccess;

/**
 * Represents the exceptions got while access data from test data sources.
 * 
 * @author Kash
 * @version 1.0
 */
public class DataAccessException extends RuntimeException {

    //just for removing warning, the exceptions are not be expected to be java serialized
    private static final long serialVersionUID = -1L;

    /**
     * Initialize with message and cause.
     * 
     * @param exception
     * @param cause
     */
    public DataAccessException(String message, Throwable cause) {
        super(message, cause);
    }

    /**
     * Initialize with message alone.
     * 
     * @param arg0
     */
    public DataAccessException(String message) {
        super(message);
    }

}
