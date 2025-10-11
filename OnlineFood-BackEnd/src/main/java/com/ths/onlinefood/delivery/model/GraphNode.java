
package com.ths.onlinefood.delivery.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "graph_node", indexes = {
    @Index(name = "idx_node_location", columnList = "latitude,longitude")
})
public class GraphNode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 200)
    private String nodeName;
    
    @Column(nullable = false)
    private Double latitude;
    
    @Column(nullable = false)
    private Double longitude;
    
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private NodeType nodeType;
    
    private String address; // Địa chỉ đầy đủ
    
    private Boolean isActive = true; // Nút có hoạt động không
    
    @JsonIgnore
    @OneToMany(mappedBy = "startNode", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GraphEdge> outgoingEdges = new ArrayList<>();
    
    @JsonIgnore
    @OneToMany(mappedBy = "endNode")
    private List<GraphEdge> incomingEdges = new ArrayList<>();
    
    // Helper method
    public void addOutgoingEdge(GraphEdge edge) {
        outgoingEdges.add(edge);
        edge.setStartNode(this);
    }
}
