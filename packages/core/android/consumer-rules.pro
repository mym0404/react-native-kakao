# Kakao SDK 2.25.0 uses kotlinx.serialization. Its enum serializer reflects on
# enum fields to read annotations, while generated serializers use model fields.
-keep class com.kakao.sdk.**.model.* { <fields>; }
-keep interface com.kakao.sdk.** { *; }
-keepclassmembers enum com.kakao.sdk.** {
    public static **[] values();
    public static ** valueOf(java.lang.String);
    <fields>;
}
-keepattributes Signature,InnerClasses,EnclosingMethod
-keepattributes RuntimeVisibleAnnotations,RuntimeInvisibleAnnotations,RuntimeVisibleParameterAnnotations,RuntimeInvisibleParameterAnnotations,AnnotationDefault

# OkHttp 4.9.3 references these optional TLS providers without bundling them.
-dontwarn org.bouncycastle.jsse.**
-dontwarn org.conscrypt.*
-dontwarn org.openjsse.**

# Retrofit 2.9.0 bundles its base service rules. These R8 full-mode rules were
# added later and are needed by Kakao's annotated service return types.
-if interface com.kakao.sdk.** { @retrofit2.http.* <methods>; }
-keep,allowobfuscation interface * extends <1>
-keep,allowobfuscation,allowshrinking class kotlin.coroutines.Continuation
-if interface com.kakao.sdk.** { @retrofit2.http.* public *** *(...); }
-keep,allowoptimization,allowshrinking,allowobfuscation class <3>
-keep,allowobfuscation,allowshrinking class retrofit2.Response
