#!/usr/bin/env bash

# Gradle property to change
PROPERTY="newArchEnabled"

# New value from first command line argument
NEW_VALUE="$1"
POD="$2"
CLEAN="$3"

# Modify app.json
JSON="example/app.json"
sed -i '' -e "s/\"newArchEnabled\": true/\"newArchEnabled\": ${NEW_VALUE}/g" $JSON
sed -i '' -e "s/\"newArchEnabled\": false/\"newArchEnabled\": ${NEW_VALUE}/g" $JSON

# Validate new value is either "true" or "false"
if [ "${NEW_VALUE}" != "true" ] && [ "${NEW_VALUE}" != "false" ]; then
  echo "Error: The argument should be either 'true' or 'false'"
  exit 1
fi

if [ ! -d "example/android" ]; then
    ANDROID_GEN=1
    yarn gen:android
fi
if [ ! -d "example/ios" ]; then
    IOS_GEN=1
    yarn gen:ios
fi


# Gradle properties file
FILE="example/android/gradle.properties"

# Create a backup of the original file
# cp ${FILE} ${FILE}.bak

# Use 'sed' to replace the property value
sed -i '' -e "s/${PROPERTY}=.*/${PROPERTY}=${NEW_VALUE}/" ${FILE}





if [[ $CLEAN == 'true' ]]; then
yarn gen:android:clean
yarn gen:ios:clean
else

if [[ $ANDROID_GEN != '1' ]]; then
yarn gen:android
fi
if [[ $IOS != '1' ]]; then
yarn gen:ios
fi

if [[ $POD == 'true' ]]; then
if [[ $NEW_VALUE == 'true' ]]; then
  yarn pod:new
else
  yarn pod:old
fi
fi
fi



