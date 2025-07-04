# ===================
# Step 1: Build stage
# ===================
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy the full source code
COPY src ./src

# Build the app (skip tests)
RUN mvn clean package -DskipTests

# ===================
# Step 2: Runtime stage
# ===================
FROM openjdk:21-jdk-slim
WORKDIR /app

# Copy the built jar from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port 8080
EXPOSE 8080

# Run the Spring Boot app
ENTRYPOINT ["java", "-jar", "app.jar"]
