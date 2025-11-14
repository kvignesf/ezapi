package com.org.gen.json2pojo.exception;

/**
 * Represents the any framework related errors.. 
 * @author Kash
 */
public class ServiceException extends RuntimeException {

    //just for removing warning, the exceptions are not be expected to be java serialized
    private static final long serialVersionUID = -1L;
    
    /** 
     * Initialize with message and cause.
     * @param message
     * @param cause
     */
    public ServiceException(String message, Throwable cause) {
        super(message, cause);
    }

    /**
     * Initialize with message alone.
     * @param message
     */
    public ServiceException(String message) {
        super(message);
    }
    
}
