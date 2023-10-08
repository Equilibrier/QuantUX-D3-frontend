export async function fetchGETWithAuthorization(url, token) {
    try {
      const headers = new Headers({
        "Authorization": `Bearer ${token}`
      });
  
      const response = await fetch(url, {
        method: "GET",
        headers: headers
      });
  
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        throw new Error(`Failed to fetch data(GET): ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`An error occurred: ${error}`);
    }
  }

  export async function fetchPOSTWithAuthorization(url, postData, token) {
    try {
      const headers = new Headers({
        "Authorization": `Bearer ${token}`
      });
  
      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(postData)
      });
  
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        throw new Error(`Failed to fetch data(POST): ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`An error occurred: ${error}`);
    }
  }