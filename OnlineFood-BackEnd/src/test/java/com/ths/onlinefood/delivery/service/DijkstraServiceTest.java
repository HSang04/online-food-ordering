/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.ths.onlinefood.delivery.service;

import com.ths.onlinefood.delivery.model.*;
import com.ths.onlinefood.delivery.repository.*;
import com.ths.onlinefood.delivery.service.DijkstraService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DijkstraServiceTest {
    
    @Mock
    private GraphNodeRepository nodeRepository;
    
    @Mock
    private GraphEdgeRepository edgeRepository;
    
    @InjectMocks
    private DijkstraService dijkstraService;
    
    private GraphNode node1;
    private GraphNode node2;
    private GraphNode node3;
    private GraphEdge edge1;
    private GraphEdge edge2;
    
    @BeforeEach
    void setUp() {
        // Setup test data
        node1 = new GraphNode();
        node1.setId(1L);
        node1.setNodeName("Node 1");
        node1.setLatitude(10.7769);
        node1.setLongitude(106.7009);
        node1.setNodeType(NodeType.STORE);
        node1.setIsActive(true);
        
        node2 = new GraphNode();
        node2.setId(2L);
        node2.setNodeName("Node 2");
        node2.setLatitude(10.7726);
        node2.setLongitude(106.6980);
        node2.setNodeType(NodeType.INTERSECTION);
        node2.setIsActive(true);
        
        node3 = new GraphNode();
        node3.setId(3L);
        node3.setNodeName("Node 3");
        node3.setLatitude(10.7640);
        node3.setLongitude(106.6813);
        node3.setNodeType(NodeType.INTERSECTION);
        node3.setIsActive(true);
        
        edge1 = new GraphEdge();
        edge1.setId(1L);
        edge1.setStartNode(node1);
        edge1.setEndNode(node2);
        edge1.setDistance(0.5);
        edge1.setDuration(2.0);
        edge1.setRoadType(RoadType.MAIN_ROAD);
        edge1.setIsActive(true);
        edge1.setIsTwoWay(true);
        
        edge2 = new GraphEdge();
        edge2.setId(2L);
        edge2.setStartNode(node2);
        edge2.setEndNode(node3);
        edge2.setDistance(1.2);
        edge2.setDuration(4.0);
        edge2.setRoadType(RoadType.MAIN_ROAD);
        edge2.setIsActive(true);
        edge2.setIsTwoWay(true);
    }
    
    @Test
    void testCalculateDistance() {
        // Test Haversine formula
        double distance = dijkstraService.calculateDistance(
            10.7769, 106.7009,
            10.7726, 106.6980
        );
        
        assertTrue(distance > 0);
        assertTrue(distance < 1); // Should be less than 1 km
    }
    
    @Test
    void testFindShortestPath_Success() {
        // Arrange
        when(nodeRepository.findNearbyNodes(anyDouble(), anyDouble(), anyDouble()))
            .thenReturn(Arrays.asList(node1))
            .thenReturn(Arrays.asList(node3));
        
        when(nodeRepository.findByIsActiveTrue())
            .thenReturn(Arrays.asList(node1, node2, node3));
        
        when(edgeRepository.findByStartNodeAndIsActiveTrue(node1))
            .thenReturn(Arrays.asList(edge1));
        
        when(edgeRepository.findByStartNodeAndIsActiveTrue(node2))
            .thenReturn(Arrays.asList(edge2));
        
        when(edgeRepository.findByEndNodeAndIsActiveTrue(any()))
            .thenReturn(Arrays.asList());
        
        when(edgeRepository.findEdgeBetweenNodes(any(), any()))
            .thenReturn(Optional.of(edge1));
        
        // Act
        DeliveryRoute route = dijkstraService.findShortestPath(
            10.7769, 106.7009,
            10.7640, 106.6813
        );
        
        // Assert
        assertNotNull(route);
        assertNotNull(route.getCoordinates());
        assertTrue(route.getCoordinates().size() > 0);
        assertTrue(route.getTotalDistance() > 0);
        assertTrue(route.getEstimatedDuration() > 0);
    }
    
    @Test
    void testFindShortestPath_NoNodesFound() {
        // Arrange
        when(nodeRepository.findNearbyNodes(anyDouble(), anyDouble(), anyDouble()))
            .thenReturn(Arrays.asList());
        
        when(nodeRepository.findNearestNode(anyDouble(), anyDouble()))
            .thenReturn(Optional.empty());
        
        // Act
        DeliveryRoute route = dijkstraService.findShortestPath(
            10.7769, 106.7009,
            10.7640, 106.6813
        );
        
        // Assert
        assertNotNull(route);
        assertEquals(2, route.getCoordinates().size()); // Direct route
    }
}