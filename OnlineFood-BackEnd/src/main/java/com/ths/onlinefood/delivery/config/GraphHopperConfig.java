package com.ths.onlinefood.delivery.config;

import com.graphhopper.GraphHopper;
import com.graphhopper.config.Profile;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.File;

@Slf4j
@Configuration
public class GraphHopperConfig {

    @Value("${graphhopper.osm.file:data/vietnam-251014.osm.pbf}")
    private String osmFile;

    @Value("${graphhopper.cache.dir:data/graphhopper-cache}")
    private String cacheDir;

    @Bean
    public GraphHopper graphHopper() {
        log.info("=== 🚀 Initializing GraphHopper ===");

        File osmFileCheck = new File(osmFile);
        if (!osmFileCheck.exists()) {
            throw new RuntimeException("❌ File OSM không tồn tại: " + osmFile);
        }

        log.info("✅ File OSM: {} ({} MB)",
                osmFileCheck.getName(),
                osmFileCheck.length() / 1024 / 1024);

        GraphHopper hopper = new GraphHopper();
        hopper.setOSMFile(osmFile);
        hopper.setGraphHopperLocation(cacheDir);

        // v7.0: Profile car + fastest, không cần CustomModel
        Profile carProfile = new Profile("car")
                .setVehicle("car")
                .setWeighting("fastest");
        hopper.setProfiles(carProfile);

        log.info("⏳ Loading OSM data...");
        hopper.importOrLoad();

        log.info("✅ GraphHopper ready!");
        log.info("📍 Nodes: {}", hopper.getBaseGraph().getNodes());
        log.info("🛣️  Edges: {}", hopper.getBaseGraph().getEdges());

        return hopper;
    }
}