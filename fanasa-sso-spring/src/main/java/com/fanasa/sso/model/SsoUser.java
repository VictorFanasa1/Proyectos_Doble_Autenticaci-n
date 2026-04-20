package com.fanasa.sso.model;

import java.util.List;

public record SsoUser(
    String       name,
    String       email,
    String       objectId,
    String       tenantId,
    List<String> roles
) {}
