package response

import (
	"net/http"
	"github.com/gin-gonic/gin"
)

type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

type PaginatedResponse struct {
	Success    bool        `json:"success"`
	Message    string      `json:"message"`
	Data       interface{} `json:"data"`
	NextCursor string      `json:"next_cursor,omitempty"`
	HasMore    bool        `json:"has_more"`
}

func JSON(c *gin.Context, statusCode int, success bool, message string, data interface{}, err string) {
	c.JSON(statusCode, APIResponse{
		Success: success,
		Message: message,
		Data:    data,
		Error:   err,
	})
}

func OK(c *gin.Context, message string, data interface{}) {
	JSON(c, http.StatusOK, true, message, data, "")
}

func Created(c *gin.Context, message string, data interface{}) {
	JSON(c, http.StatusCreated, true, message, data, "")
}

func BadRequest(c *gin.Context, message string, err error) {
	errStr := ""
	if err != nil {
		errStr = err.Error()
	}
	JSON(c, http.StatusBadRequest, false, message, nil, errStr)
}

func Unauthorized(c *gin.Context, message string) {
	JSON(c, http.StatusUnauthorized, false, message, nil, "Unauthorized")
}

func Forbidden(c *gin.Context, message string) {
	JSON(c, http.StatusForbidden, false, message, nil, "Forbidden")
}

func NotFound(c *gin.Context, message string) {
	JSON(c, http.StatusNotFound, false, message, nil, "Not Found")
}

func InternalServerError(c *gin.Context, message string, err error) {
	errStr := ""
	if err != nil {
		errStr = err.Error()
	}
	JSON(c, http.StatusInternalServerError, false, message, nil, errStr)
}

func Paginated(c *gin.Context, message string, data interface{}, nextCursor string, hasMore bool) {
	c.JSON(http.StatusOK, PaginatedResponse{
		Success:    true,
		Message:    message,
		Data:       data,
		NextCursor: nextCursor,
		HasMore:    hasMore,
	})
}

