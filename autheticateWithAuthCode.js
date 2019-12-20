// authenticateWithAuthCodeFromCallbackUrl
authenticateWithAuthCodeFromCallbackUrl = (callbackUrl: string) : Promise<any> => {

    // Note: For some reason, this callback gets called multiple times
    // We use this boolean guard here to prevent any other authentication attempts
    // while one is in progress
    
    if(!this.authenticationAttemptInProgress){

        this.authenticationAttemptInProgress = true

        recordAuthBreadCrumb('AuthService.authenticateWithAuthCodeFromCallbackUrl.')
    
        var _this = this
        return this.requestAccessCodeAfterCallback(callbackUrl)
                .then(function(response) {
                    return _this.saveTokenEndpointResponse(JSON.parse(response))
                })
                .then(success => {
                    if(success){

                        // also indicate that we are now signed in
                        _this.isSignedIn = true
                        recordAuthBreadCrumb('Successfully signed in! Access and Refresh tokens saved from auth0.')
                        return _this.getUserInfo()
                    } else {
                        recordAuthBreadCrumb('AuthService.authenticateWithAuthCodeFromCallbackUrl: Saving the token endpoint response failed.')
                        return Promise.reject('Saving the token endpoint response failed.')
                    }
                })
                .then(userInfoResponseObj => {
                    //set user context for menu
                    initialiseUserContext(
                        userInfoResponseObj.sub,  //auth0 user id
                        userInfoResponseObj.email //email address
                    )

                    mixpanelIdentify(userInfoResponseObj.sub, userInfoResponseObj.email)

                    // indicate authentication process completed
                    _this.authenticationAttemptInProgress = false

                    return userInfoResponseObj.sub
                })
                .catch(err => {

                    // If we encounter an error, still indicate authentication process completed
                    _this.authenticationAttemptInProgress = false
                                
                    return Promise.reject(AuthService.formatErrorMessage('Authentication with Authcode.', err))
                })
    } else {
        recordAuthBreadCrumb('Authentication attempt is in progress.')
        return Promise.reject('Authentication attempt is in progress.')
    }
}