# RunServiceApi

All URIs are relative to *http://localhost:8084/api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**destroyRun**](#destroyrun) | **DELETE** /runs/{runId} | Destroy a run by its ID|
|[**dispatchRun**](#dispatchrun) | **POST** /runs | Dispatch a new run|
|[**getRunById**](#getrunbyid) | **GET** /runs/{runId} | Get a run by its ID|
|[**getRunLogs**](#getrunlogs) | **GET** /runs/{runId}/logs | Get logs for a run|
|[**getRuns**](#getruns) | **GET** /runs | List all runs|
|[**getRunsByStatus**](#getrunsbystatus) | **GET** /runs/search | Get runs by status|
|[**updateRunStatus**](#updaterunstatus) | **PUT** /runs/{runId}/status | Update the status of a run|

# **destroyRun**
> destroyRun()


### Example

```typescript
import {
    RunServiceApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RunServiceApi(configuration);

let runId: number; //ID of the run to destroy. (default to undefined)

const { status, data } = await apiInstance.destroyRun(
    runId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **runId** | [**number**] | ID of the run to destroy. | defaults to undefined|


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | Run destroyed successfully. |  -  |
|**404** | Run not found. |  -  |
|**0** | Unexpected error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **dispatchRun**
> Run dispatchRun(dispatchRunRequest)


### Example

```typescript
import {
    RunServiceApi,
    Configuration,
    DispatchRunRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new RunServiceApi(configuration);

let dispatchRunRequest: DispatchRunRequest; //

const { status, data } = await apiInstance.dispatchRun(
    dispatchRunRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **dispatchRunRequest** | **DispatchRunRequest**|  | |


### Return type

**Run**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Run dispatched successfully. |  -  |
|**0** | Unexpected error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRunById**
> Run getRunById()


### Example

```typescript
import {
    RunServiceApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RunServiceApi(configuration);

let runId: number; //ID of the run to retrieve. (default to undefined)

const { status, data } = await apiInstance.getRunById(
    runId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **runId** | [**number**] | ID of the run to retrieve. | defaults to undefined|


### Return type

**Run**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The requested run. |  -  |
|**404** | Run not found. |  -  |
|**0** | Unexpected error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRunLogs**
> string getRunLogs()


### Example

```typescript
import {
    RunServiceApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RunServiceApi(configuration);

let runId: number; //ID of the run to retrieve logs for. (default to undefined)

const { status, data } = await apiInstance.getRunLogs(
    runId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **runId** | [**number**] | ID of the run to retrieve logs for. | defaults to undefined|


### Return type

**string**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: text/plain, application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Raw logs for the specified run. |  -  |
|**404** | Run or logs not found. |  -  |
|**0** | Unexpected error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRuns**
> Array<Run> getRuns()


### Example

```typescript
import {
    RunServiceApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RunServiceApi(configuration);

const { status, data } = await apiInstance.getRuns();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<Run>**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A list of runs. |  -  |
|**0** | Unexpected error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRunsByStatus**
> Array<Run> getRunsByStatus()


### Example

```typescript
import {
    RunServiceApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RunServiceApi(configuration);

let status: RunStatus; //The status of the runs to filter by. (default to undefined)

const { status, data } = await apiInstance.getRunsByStatus(
    status
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **status** | **RunStatus** | The status of the runs to filter by. | defaults to undefined|


### Return type

**Array<Run>**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A list of runs matching the status. |  -  |
|**0** | Unexpected error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateRunStatus**
> updateRunStatus(updateRunStatusRequest)


### Example

```typescript
import {
    RunServiceApi,
    Configuration,
    UpdateRunStatusRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new RunServiceApi(configuration);

let runId: number; //ID of the run to update. (default to undefined)
let updateRunStatusRequest: UpdateRunStatusRequest; //

const { status, data } = await apiInstance.updateRunStatus(
    runId,
    updateRunStatusRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateRunStatusRequest** | **UpdateRunStatusRequest**|  | |
| **runId** | [**number**] | ID of the run to update. | defaults to undefined|


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Run status updated successfully. |  -  |
|**404** | Run not found. |  -  |
|**0** | Unexpected error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

